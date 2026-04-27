# Pixelforge — Canvas Engine Technical Blueprint

Source-of-truth document for how pixelforge's editor actually works.
Replaces the generic "Canva clone" prompt template with concrete
references to the real codebase (Angular 21 + fabric.js 7 + Vitest +
FastAPI + MongoDB).

This doc fixes several common-but-wrong assumptions about canvas
editor architecture that show up in greenfield prompts. Use it as
context when asking Claude to extend or modify the editor.

---

## 0. Stack and Source-of-Truth

| Layer            | Tech                            | Pinned in            |
|------------------|---------------------------------|----------------------|
| Frontend runtime | Angular 21 + Material 21 + CDK  | `package.json`       |
| Canvas engine    | fabric.js 7                     | `canvas.service.ts`  |
| Tests            | Vitest 4 + jsdom                | `vitest.config.ts`   |
| Backend          | FastAPI 0.115 + Motor + Mongo   | `backend/`           |
| Auth             | PyJWT + bcrypt                  | `backend/app/auth.py`|

State conventions:

- **Signals everywhere** for UI state (`signal()`, `computed()`, `effect()`).
  No `BehaviorSubject` for new UI state.
- **Standalone components only** — no `NgModule` for new code.
- `inject()` over constructor DI in services and components.
- Fabric is wrapped behind `CanvasService`; components do not call
  `new fabric.Canvas` directly.

---

## 1. Page Management — Multi-Page (PX-135)

### Architecture

A pixelforge "project" can contain N pages. Pages live in the
`Editor` component as a signal:

```ts
readonly pages = signal<Array<{
  id: string;          // crypto.randomUUID()
  canvasJson: string;  // serialized fabric canvas (single-page envelope)
  thumbnail: string;   // data URL, captured on save
}>>([]);
readonly activePage = signal<number>(0);
```

Each page's `canvasJson` is the result of
`canvas.toObject(PERSISTED_CUSTOM_PROPS)` for that page's canvas
state, captured when the user switches pages or saves. Only the
**active page** is loaded into the live fabric canvas at any
moment — other pages exist purely as serialized JSON in memory.

### Persistence envelope (PX-135)

When a project has > 1 page, the saved `canvasJson` is wrapped:

```jsonc
{
  "_multiPage": true,
  "version": 1,
  "activePage": 2,
  "pages": [
    { "id": "uuid-1", "canvasJson": "...", "thumbnail": "data:..." },
    { "id": "uuid-2", "canvasJson": "...", "thumbnail": "data:..." }
  ]
}
```

Single-page projects skip the envelope and store fabric JSON directly,
so legacy projects round-trip unchanged.

`hydrateMultiPageEnvelope` in `editor.ts:2213-2236` peels the envelope
on load. The eager-load path is `editor.ts:1984-1994`.

### Add / Duplicate / Delete page

- **Add page**: append `{ id: uuid(), canvasJson: '', thumbnail: '' }`.
  Active page becomes the new one. fabric canvas is `clearCanvas()`-ed
  + `setBackgroundMode('white')` so the new page starts blank.
- **Duplicate page**: `saveCurrentPageState()` first to flush the
  active page to JSON, then `getCanvasJSON()` of the live canvas, then
  insert a new page at `activePage + 1` with the SAME `canvasJson`
  string. Critically, `canvasJson` is a string, so the duplicate is
  isomorphic — fabric will reconstitute it as fresh objects when the
  user switches to the new page. **No deep clone of fabric objects
  needed.** This is why pixelforge avoids the `JSON.parse(JSON.
  stringify(...))` pattern from greenfield blueprints — fabric
  serialization handles it.
- **Delete page**: filter out by index, clamp `activePage` if needed,
  reload whichever page becomes active.

See `editor.ts:2271-2335`.

### Why no virtualization

Even at 50 pages, only one is rendered to fabric at a time. The
others are JSON strings in memory (~tens of KB each). The page-bar
thumbnails are tiny WebP data URLs (~5 KB each). Virtualization is
unnecessary at this scale; would only matter at 500+ pages, which
is not a realistic Canva-clone use case.

---

## 2. Image Editing — Replace, Crop, Filters, BG Removal

### Architecture

```
fabric.FabricImage  ←──── the actual canvas object
    .src             ← original URL (data: or http:)
    .scaleX/Y        ← display scale (preserves bitmap)
    .cropX/Y         ← non-destructive crop offset into bitmap
    .filters[]       ← fabric.js filter pipeline
    customType?      ← 'photo-frame' if promoted (PX-102/156)
    crossOrigin      ← 'anonymous' (PX-143; fixes CORS-on-load)
```

### Replace Image

`canvasService.replacePhotoInFrame(frame, file, mode)` in
`canvas.service.ts:944-1030` for the photo-frame case. For plain
images, the user adds a new image via `addImage(url)` and removes
the old one. There is intentionally no shared "replace bitmap in
place" path for plain images because the new image's natural
dimensions / aspect can differ.

### Crop — three flavors

1. **Plain rectangle crop** — `canvasService.startCrop()`,
   `applyCrop()`, `cancelCrop()`. Mutates `cropX/Y/width/height`
   non-destructively. Source image element + alpha channel preserved.
2. **Modal crop mode (PX-122)** — `enterCropMode()` /
   `applyCropMode()` / `cancelCropMode()`. For photo-frames only.
   Snapshots the frame's mutable state, lets the user edit pan/
   zoom/aspect/shape, Apply commits, Cancel restores from snapshot.
   See `canvas.service.ts:3539-3625`.
3. **Smart Crop (PX-123)** — saliency-biased auto-crop. 64×64 grayscale
   downsample → Sobel-like edge magnitude → weighted center-of-mass →
   biased pan offsets. No ML dep. CORS-tainted canvases fall back to
   centered crop.

### Filters

`image-filters-panel.ts` exposes Brightness, Contrast, Saturation,
Blur, Hue, plus an Auto Focus / focal blur button. Implementation
uses **fabric.js's filter pipeline**, not CSS filters, because:

- CSS filters only apply to DOM elements, not canvas pixel content.
  Exporting via `canvas.toDataURL` would lose them.
- Fabric's filters are GPU-accelerated when WebGL is available
  (`fabric.config.enableGLFiltering`), CPU fallback otherwise.
- Filter values are stored on the FabricImage as `filters: []`
  array, so they round-trip through JSON serialization
  non-destructively.

This is the **correct fix** for the common greenfield "use CSS
filters" suggestion.

### Background Removal

Two-tier (`background-removal.service.ts`):

1. **Client-side**: `@imgly/background-removal` (WASM ONNX runtime).
   No backend round-trip; works offline; ~7MB model.
2. **Server fallback**: rembg via FastAPI `/api/remove-background`.
   CPU-only ONNX. Used when client fails (low memory, etc.)

`Editor.removeBackground()` rasterizes the active image at its
**natural resolution** (PX-142: `multiplier = 1 / scaleX`, capped at
8×) so the bg-removed result doesn't lose pixels when resized later.
This is why the user reported "image quality drops after Remove BG"
in earlier sprints.

### Magic Eraser (PX-151)

Click-to-flood-fill alpha removal. Sample seed RGB at click point,
BFS over pixels within RGB-distance tolerance, set their alpha to 0.
Iterative — multiple clicks chain. Tolerance slider (4–120). See
`canvas.service.magicEraseAt()` and `magicEraseClick()`.

---

## 3. Photo Frames — Clipping Masks

### Reality vs. greenfield assumption

The greenfield "Use fabric clipPath, then double-click to enter"
pattern is **inaccurate for pixelforge**. Here's the actual model:

A photo-frame is **either**:

- A `fabric.Group` (empty placeholder, with dashed-stroke Rect + "+"
  Textbox children) — `customType: 'photo-frame'` flag, no image yet.
- A `fabric.FabricImage` (filled, after click-to-fill or drop) —
  `customType: 'photo-frame'` flag, plus custom props:

```jsonc
{
  "customType": "photo-frame",
  "frameWidth": 240,
  "frameHeight": 320,
  "frameLeft": 100,
  "frameTop": 50,
  "frameShape": "circle",     // rect | rounded | circle | hexagon | star | heart
  "fitMode": "cover",         // cover | contain | fill
  "framePanX": 0.0,           // -1..1
  "framePanY": 0.0,
  "frameZoom": 1.0,           // 1..4
  "photoAngle": 0             // ±45° internal rotation (deprecated UI in PX-154)
}
```

The **shape mask** is a fabric `clipPath` on the FabricImage,
recomputed by `buildFrameShape(shape, w, h, false)` in
`canvas.service.ts`.

The **pan/zoom** is implemented by adjusting the image's
`scaleX/Y` and `left/top` so it fits the frame in cover/contain/fill
mode (`applyFrameFit`).

There is **no "double-click to enter"** mode. Instead pixelforge's
PX-122 introduced an **explicit Crop button** on the floating toolbar
that enters a transient "crop mode" (signal flag), and the right
property panel's Apply / Cancel header lets the user commit or
revert. The model: snapshot state on enter, mutate during, commit
or restore on exit. Same UX outcome, more discoverable affordance.

### Why not native clipPath + container

Native fabric `clipPath` can mask any shape, but fabric does NOT
let a user drag the clipped image around independently of the
clipPath without nesting them in a Group — and Groups have their
own transform composition that complicates pan/zoom math. Pixelforge
chose to keep the FabricImage as the canvas object and recompute
its own scale / position to simulate the "image inside a frame"
illusion. That keeps the data model simpler (one object, not two)
at the cost of a few hundred lines of pan/zoom math in
`canvas.service.ts:1180-1330`.

---

## 4. Text Engine

`fabric.IText` and `fabric.FabricText` for editable text on canvas.
`fabric.Textbox` for wrapping text. Pixelforge uses IText for normal
headings and Textbox for the "click to add a heading / subheading /
body" presets (sidebar text panel).

Font loading via Google Fonts: `font.service.ts` lazy-loads via
WebFontLoader-style on demand. Common fonts preloaded on editor
mount (`fontService.preloadPopularFonts()`).

Inline editing: fabric handles `text:editing:entered` and
`text:editing:exited` events. `canvas.service.ts:176-185` listens
and disables auto-save during edit so the user doesn't see "Saving"
flickering on every keystroke.

Text effects (shadow, stroke, curve, magic write) are exposed in
the text-toolbar component. The "Hollow / Echo / Lift / Splice /
Neon" effects from Canva are **not yet implemented** — these are
Canva-specific compositions (multiple shadows + outline + offset).
Could be added by stacking fabric.Shadow + stroke combinations.

Magic Write (text AI) is wired via `magic-write.service.ts` to a
backend LLM endpoint.

---

## 5. Grouping & Selection

### Greenfield correction

The blueprint says: *"Once grouped, the items' coordinates (x,y)
should become relative to the group's top-left corner."*

**This is wrong for fabric.js**. When you add objects to a
`fabric.Group`, fabric stores each child's position **relative to
the GROUP'S CENTER**, not its top-left. fabric uses center-based
positioning by default (`originX/Y = 'center'` for groups). The
group's bounding box is recomputed automatically from the children.

The relevant API:

```ts
// Multi-select → Group
canvas.groupSelected();
// Internally: get active selection, call new fabric.Group(objects),
// destroy the active selection, set the group as active.

// Group → Ungroup
canvas.ungroupSelected();
// Internally: group.toActiveSelection() returns an ActiveSelection
// of the children; the Group is removed.
```

`canvas.service.ts:1889-1965`.

### Multi-select behavior

fabric.js's `ActiveSelection` is the multi-select primitive. When
the user shift-clicks or drag-selects multiple objects, fabric
creates an ActiveSelection automatically. PX-141's floating context
toolbar treats `ActiveSelection` as the "group" context (showing
Group / Ungroup / Front / Back / Delete) — see
`editor.ts:classifySelection()`.

---

## 6. Z-Index & Layers

Fabric stores objects in a flat array on the canvas. Z-index
order = array index order (last in = top of stack).

PX-141 verbs:

- **Bring to front**: `canvas.bringObjectToFront(obj)`
- **Send to back**: `canvas.sendObjectToBack(obj)`
- Forward / backward 1 step: `canvas.bringObjectForward(obj)` /
  `sendObjectBackwards(obj)` — exposed in the older
  `<app-text-toolbar>` Position dropdown (text/shape only post-PX-155;
  for images the PX-141 toolbar's Front/Back buttons are the canonical
  path).

Layers panel (`<app-layer-panel>`) is the secondary surface — shows
all objects as a draggable list, click to select, drag to reorder.

---

## 7. Non-Destructive Editing — Reality

The greenfield doc's principle is right: **don't overwrite the
original**. In pixelforge:

- **Crop**: `cropX/Y/width/height` mutate, source image stays.
- **Filters**: `filters: []` array on FabricImage.
- **Bg removal**: produces a NEW image (transparent PNG); the old
  image is removed and the new one added. This IS destructive in
  the sense that the original image element is gone from this object.
  The undo/redo stack preserves the prior state via
  `historyService.snapshot()`, so Ctrl+Z restores the original image.
- **Magic Eraser**: same as bg removal — replaces the image element
  in place via `setElement()`. Undo restores via history.
- **Photo-frame state**: pan/zoom/aspect/shape are non-destructive
  custom props.

The history mechanism (`history.service.ts`) snapshots the canvas
JSON on every `commitChange()` call. Undo restores by re-running
`canvas.loadFromJSON(snapshot)`. This gives full undo/redo for
even destructive operations like bg removal.

---

## Pixelforge-Specific Pitfalls (Bug Class Reference)

For future Claude prompts, these are gotchas that have repeatedly
caused regressions in this codebase:

1. **fabric 7 event names changed**: `getPointer` → `getScenePoint`
   (PX-151).
2. **`toObject(allowlist)` allowlist is for CUSTOM props** —
   defaults like `scaleX/scaleY/angle` are auto-included by fabric.
   Don't try to "include" them. (Was confused in PX-114 era.)
3. **`canvas.backgroundColor = ''` makes canvas transparent**;
   `undefined` also works. The exporter must clear `backgroundImage`
   too for transparent export (PX-153).
4. **PX-147 — list endpoint strips `canvas_json`**. Boot-time backend
   sync via `/api/projects` returns ProjectResponse without
   `canvas_json` for performance. Naive `{...local, ...incoming}`
   spread wipes local with `undefined`. Always preserve
   `incoming.canvasJson ?? existing.canvasJson`.
5. **PX-148/149/150 — three layers of mousedown deselect** intercepted
   toolbar clicks before their handlers ran. Whitelisting fixed it,
   but new toolbars need to either be inside a whitelisted container
   or wrap their buttons in a `<button>` element that the generic
   button-click guard catches.
6. **Image `crossOrigin = 'anonymous'`** must be re-injected on
   `loadFromJSON` for projects saved before that became default
   (PX-143). Otherwise CORS-tainted canvases break Remove BG /
   Magic Eraser / Smart Crop on subsequent edits.
7. **localStorage quota** is a real failure mode for projects with
   inline base64 images. PX-139 surfaces a snackbar on the second-
   tier slim-save retry failure; the user should be guided to clear
   trash or split into multiple projects.

---

## How To Use This Doc with Claude

When prompting Claude for a new feature in pixelforge, reference
this doc and ground in concrete file paths. Bad prompt:

> "Add a magic expand feature to the canvas like Canva."

Good prompt:

> "Add a magic-expand feature analogous to PX-151 Magic Eraser. Add
> `magicExpandAt(image, edge)` to canvas.service.ts that takes an
> outpainting prompt + edge ('top' | 'bottom' | 'left' | 'right'),
> sends a request to a new backend endpoint /api/magic-expand, and
> returns a wider FabricImage. UI surface: button in
> property-panel.ts image-quick-actions next to Magic Eraser.
> Constraints: photo-frames AND plain images both eligible (per
> PX-156 PX-138 gating). Don't break PX-145 toolbar visibility
> sync. Tests in canvas.service.spec.ts following the PX-151
> pattern. Keep the file list to canvas.service.ts +
> property-panel.ts + a new backend /api/magic-expand route +
> matching pytest. Story file path:
> `_bmad-output/implementation-artifacts/stories/PX-{NNN}-magic-expand.md`."

This pattern: anchor in the existing PXs, reference real file paths,
state constraints up front, declare the diff contract.
