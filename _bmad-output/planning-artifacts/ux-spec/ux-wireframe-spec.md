# Pixels — UX Wireframe Spec

**Author:** Sally (UX Designer), dispatched by Orion
**Date:** 2026-04-24
**Status:** Draft for review
**Depends on:** `../vision/north-star-vision.md`
**Audience:** John (PRD), Amelia (implementation), Winston (layout → component boundary)

---

## 1. Design Principles

1. **Three clicks to editing.** From app open → desired content type → pick template → in editor, maximum three interactions.
2. **Brand Kit follows the user everywhere.** Colors, fonts, and logos propagate into every template automatically.
3. **The hub is the front door.** Users should feel "I can make anything here" from the first screen, even if only some categories are fully built.
4. **Pair creative flow with guardrails.** Accessibility contrast, platform size constraints, and text-readability hints are ambient — never blocking.
5. **Two distinct flows deserve two distinct UIs.** Logo Creator and Logo AI-Cleanup are not one screen with a toggle — they are two choices with tailored sidebars.

---

## 2. Information Architecture

```
/ (dashboard — existing)
/hub                        [NEW] 6-tile content chooser
/gallery/:type              [NEW] template gallery for a content type (ig-post, ig-story, linkedin-post, linkedin-banner, yt-thumbnail, logo)
/editor/:projectId          [EXTEND] existing editor — add platform size preset, brand-kit auto-apply
/logo/mode-chooser          [NEW] Creator vs AI-Cleanup mode selector
/logo/create/:projectId     [NEW] logo creator editor
/logo/cleanup/:projectId    [NEW] logo AI-cleanup stepper + editor
/brand-kit                  [EXISTING] — extend with "Logos" section
/projects                   [EXISTING]
/auth                       [EXISTING]
```

---

## 3. Screen — `/hub`

The new default landing screen for authenticated users. Replaces blank-canvas-first flow.

```
┌────────────────────────────────────────────────────────────────────┐
│  [logo]  pixels                                  👤 Brand Kit  ⚙️  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   What would you like to make today?                               │
│                                                                    │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│   │ 🟪  Instagram │  │ 📱  Instagram │  │ 💼 LinkedIn  │             │
│   │    Post       │  │     Story     │  │    Post      │             │
│   │  1080×1080    │  │  1080×1920    │  │  1200×627    │             │
│   └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                    │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│   │ 💼 LinkedIn  │  │ ▶️  YouTube   │  │ ✨   Logo    │             │
│   │    Banner     │  │   Thumbnail   │  │              │             │
│   │  1584×396     │  │  1280×720     │  │              │             │
│   └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                    │
│   Recent projects ▾       Start from scratch ▾                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Behaviors:**
- Each tile shows the platform icon, name, and canvas dimensions.
- Tap a tile → navigate to `/gallery/:type`.
- "Recent projects" is a horizontally-scrolling list pulled from `ProjectService.listProjects()`.
- "Start from scratch" is a secondary affordance — opens the editor with a size picker dialog.
- Keyboard navigable. Each tile is a `<button>` with `aria-label`. Focus visible.
- Responsive: 3×2 grid on desktop, 2×3 on tablet, 1×6 stack on mobile.

**Accessibility:**
- Tile size ≥ 160×120px at smallest breakpoint (accessibility hit-target).
- Color contrast on tile labels: WCAG AA (4.5:1 minimum for text).
- `AccessibilityService` audits tile colors against the chosen Brand Kit background.

---

## 4. Screen — `/gallery/:type`

Template browsing for a chosen content type.

```
┌────────────────────────────────────────────────────────────────────┐
│  ←  Instagram Post templates                      👤 Brand Kit  ⚙️  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Filter:  [ All ] [ Bold ] [ Minimal ] [ Festive ] [ Corporate ]   │
│                                                                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                           │
│  │ tmpl │  │ tmpl │  │ tmpl │  │ tmpl │    ← 20 templates per      │
│  │  #1  │  │  #2  │  │  #3  │  │  #4  │       content type, min  │
│  └──────┘  └──────┘  └──────┘  └──────┘                           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                           │
│  │ tmpl │  │ tmpl │  │ tmpl │  │ tmpl │                           │
│  │  #5  │  │  #6  │  │  #7  │  │  #8  │                           │
│  └──────┘  └──────┘  └──────┘  └──────┘                           │
│                                                                    │
│  [Show more]          [Start from scratch → blank 1080×1080]       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Behaviors:**
- Templates are rendered as thumbnail previews (fetched from `TemplateService.getThumbnail()`).
- Every thumbnail is pre-composed with the user's Brand Kit colors where the template has placeholder palette slots.
- Tap a template → creates a new project from that template + navigates to `/editor/:projectId`.
- Filters are driven by a `tags` field on each template document.
- "Start from scratch" creates an empty project at the correct canvas size.

---

## 5. Screen — `/editor/:projectId` (existing, extended)

The existing editor gains platform-size awareness and Brand-Kit auto-apply on template load.

**New UI additions (not a redesign):**

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Back   [Project name]      ◀ IG Post 1080×1080 ▶   [Export] ...  │
├──────────────┬──────────────────────────────────┬──────────────────┤
│              │                                  │                  │
│ Sidebar      │         Canvas                   │  Properties      │
│ (existing)   │         (existing fabric.js)     │  (existing)      │
│              │                                  │                  │
│              │                                  │                  │
│              │                                  │                  │
└──────────────┴──────────────────────────────────┴──────────────────┘
```

**Additions:**
- **Canvas size indicator/selector** in top bar: shows current platform preset (IG Post 1080×1080), click to change → opens a small menu of platform presets + a custom size option.
- **"Resize for..." action** — one-click clone-to-new-platform (e.g., from IG Post → IG Story). Canvas scales and repositions text/images using reasonable defaults.
- **Brand Kit auto-apply toast** on first template load: *"Applied your Brand Kit colors to this template. Undo?"* (7-second auto-dismiss).

---

## 6. Screen — `/logo/mode-chooser`

The Logo tile on the hub routes here first.

```
┌────────────────────────────────────────────────────────────────────┐
│  ←  Logo                                          👤 Brand Kit  ⚙️  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   How do you want to start?                                        │
│                                                                    │
│   ┌──────────────────────────┐   ┌──────────────────────────┐     │
│   │                          │   │                          │     │
│   │     🎨                   │   │     🪄                   │     │
│   │                          │   │                          │     │
│   │   Start from scratch     │   │   Clean up an AI logo    │     │
│   │                          │   │                          │     │
│   │   Shapes, text, your     │   │   Import from Midjourney,│     │
│   │   brand colors.          │   │   DALL-E, or any image — │     │
│   │                          │   │   we'll clean and        │     │
│   │                          │   │   vectorize it for you.  │     │
│   │                          │   │                          │     │
│   │   [ Create →  ]          │   │   [ Import →  ]          │     │
│   │                          │   │                          │     │
│   └──────────────────────────┘   └──────────────────────────┘     │
│                                                                    │
│   Recent logos ▾                                                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**UX default:** First-time users land with neither pre-selected — deliberate tap required. After first use, the last-chosen mode gets a subtle highlight.

> Orion escalation ask: user has not yet answered whether the default should pre-select "Create from scratch" or "Clean up an AI logo" for first-time users. Current recommendation: **no default** — the user's first logo intent is meaningful metadata.

---

## 7. Screen — `/logo/create/:projectId`

Logo Creator editor.

```
┌────────────────────────────────────────────────────────────────────┐
│  ←  Logo Creator                            [Export ▾]  [Save]    │
├───────────────┬──────────────────────────────┬────────────────────┤
│ Shape Library │                              │  Properties        │
│               │                              │                    │
│ Geometric ▾   │                              │  Font: …           │
│   ○ ● □ ◯ △   │        Canvas                │  Weight: …         │
│   ◇ ⬡ ⬢        │                              │  Fill: [BK color]  │
│ Icons ▾       │        (fabric.js)           │  Stroke: …         │
│   🔧 ⭐ ❤️ ✨  │                              │  Pairing: suggest  │
│               │                              │                    │
│ Text ▾        │                              │                    │
│   + Add Text  │                              │                    │
│               │                              │                    │
│ Brand Kit ▾   │                              │                    │
│   [swatches]  │                              │                    │
│               │                              │                    │
└───────────────┴──────────────────────────────┴────────────────────┘
```

**Behaviors:**
- Shape library ships with ~30 seed primitives (circles, rects, polygons, stars, basic icons).
- Text tool uses existing `DesignHelperService.getFontPairings()` — the right-side "Pairing: suggest" button proposes 3 complementary fonts.
- Brand Kit swatches are the user's stored colors.
- Boolean operations (union / subtract / intersect) are **NOT in MVP** (deferred). Users compose with layered shapes instead.
- Every symbol gets a `z-order` handle in the layers panel.

---

## 8. Screen — `/logo/cleanup/:projectId`

Logo AI-Cleanup stepper.

```
┌────────────────────────────────────────────────────────────────────┐
│ ←   Clean up an AI logo                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   [1 Import] → [2 Remove BG] → [3 Vectorize] → [4 Recolor]        │
│    → [5 Edit] → [6 Export]                                        │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   Step 3: Vectorize                                                │
│                                                                    │
│   ┌────────────────┐         ┌────────────────┐                   │
│   │                │         │                │                   │
│   │  Original      │   →     │  Vectorized    │                   │
│   │  (raster)      │         │  (SVG preview) │                   │
│   │                │         │                │                   │
│   └────────────────┘         └────────────────┘                   │
│                                                                    │
│   Quality:                                                         │
│   Simple  ◉─────●─────◯  Detailed                                 │
│                                                                    │
│   [ Skip this step ]          [ Back ]    [ Next: Recolor → ]     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Per-step detail:**

| Step | What happens | Tech |
| --- | --- | --- |
| 1. Import | User drops PNG/JPG/WebP or SVG. Preview displayed. If SVG, skip to step 4. | HTML5 drag-drop |
| 2. Remove BG | Runs `@imgly/background-removal` (client) or `rembg` (server). Before/after toggle. Skip if already transparent. | existing |
| 3. Vectorize | `imagetracerjs` runs client-side. Quality slider controls path count. Live preview. | NEW dep |
| 4. Recolor | Walks SVG fill/stroke tree. "Snap to Brand Kit" checkbox maps every color to nearest Brand Kit color. Per-color overrides. | pure logic |
| 5. Edit | Lands in the Logo Creator editor surface (reuse). User can refine any path, add text, adjust. | reuse |
| 6. Export | Multi-format dialog: SVG (native), PNG transparent (512/256/128/64/32), ICO multi-res, favicon. Contrast-check preview against light/dark/brand. | extend `ExportService` |

**Accessibility:** Stepper uses `aria-current="step"` on the active step. Keyboard Tab + Enter advances. Skip button always focusable.

---

## 9. Mini Design System

(Details to expand in a separate design-tokens doc; included here as directional constraints for Amelia.)

- **Grid:** 8pt base. 4pt for micro-adjustments.
- **Typography:** Inter for UI. Existing Angular Material token layer.
- **Color:** User's Brand Kit feeds into CSS custom properties. Light/dark theme via existing `ThemeService`.
- **Spacing:** Sidebar 280px (existing). Properties panel 320px. Canvas fills remainder.
- **Elevation:** Material mdc-elevation tokens, no custom shadows.
- **Motion:** Respect `prefers-reduced-motion`. Default transitions 200ms ease-out.
- **Tile design (hub):** Rounded 16px corners, solid fill matching platform brand color at 12% opacity, icon top-left, label bottom-left, size label bottom-right.

---

## 10. Component boundary notes (for Winston + Amelia)

| New component | Location | Existing service deps |
| --- | --- | --- |
| `HubComponent` | `src/app/features/hub/hub.component.ts` | `ProjectService`, `BrandKitService`, `TemplateService` |
| `GalleryComponent` | `src/app/features/hub/gallery.component.ts` | `TemplateService`, `BrandKitService` |
| `PlatformSizeIndicator` | `src/app/features/editor/components/platform-size-indicator.ts` | (extends existing) |
| `LogoModeChooserComponent` | `src/app/features/logo/mode-chooser.component.ts` | — |
| `LogoCreatorComponent` | `src/app/features/logo/create/logo-creator.component.ts` | `CanvasService`, `BrandKitService`, `DesignHelperService` |
| `LogoCleanupComponent` | `src/app/features/logo/cleanup/logo-cleanup.component.ts` | `BackgroundRemovalService`, new `VectorizeService`, `BrandKitService` |
| `VectorizeService` (NEW) | `src/app/core/services/vectorize.service.ts` | wraps `imagetracerjs` + `svgo` |

---

## 11. Reviewer sign-off

| Reviewer | Role | Status |
| --- | --- | --- |
| Sally | Self-review | ✅ |
| John | PRD alignment | ⏳ pending |
| Winston | Component boundary / arch | ⏳ pending |
| Amelia | Implementability | ⏳ pending |
| Paige | Accessibility wording | ⏳ pending |
