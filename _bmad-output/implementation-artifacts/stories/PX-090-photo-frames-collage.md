# Story PX-090 — Photo frames for collage

**Epic:** I — Editor power-features
**Sprint:** 11
**Size:** M
**Priority:** P1
**Owner:** Amelia / Orion (autonomous mode)
**Status:** Ready for dev
**Depends on:** PX-072/PX-076 editor chrome retheme (no blocker; this story extends sidebar-drawer)

---

## Context

Collage layouts are one of the most-used Canva surfaces — drag a layout onto the canvas, fill each "frame" slot with a photo, done. Pixelforge's editor today supports adding individual images via the Uploads tab, but there is no preset "collage" affordance and no concept of an empty frame slot waiting to receive a photo.

This story adds a new **Frames** sidebar tab with 8–10 preset layouts (2-up, 3-up, 4-grid, magazine asymmetric, polaroid scatter, etc.) and the click-to-fill mechanic each frame uses.

---

## Acceptance Criteria

- **AC-1** — A new **Frames** tab is present in the sidebar drawer's icon rail, between Elements and Text. Clicking it opens a drawer panel listing 8 preset collage layouts as tappable cards (each card shows a small preview of the layout shape).
- **AC-2** — Clicking a layout card adds N empty `photo-frame` placeholders to the active canvas. Each placeholder is a fabric.Rect with a dashed slate stroke, light-slate fill, and a centered "+" icon (rendered as a fabric.Group: rect + icon textbox). Placeholders sit at the layout's preset coordinates **scaled to fit 80% of the canvas** so the same preset works on any platform.
- **AC-3** — The 8 MVP presets are: `Split-2 horizontal`, `Split-2 vertical`, `Triptych (3 vertical)`, `2x2 grid`, `1+2 magazine`, `2+1 magazine`, `Polaroid scatter (4)`, `Strip-3 horizontal`.
- **AC-4** — Each photo-frame placeholder responds to a click by opening the OS file picker (image MIME types only). On selecting a photo, the placeholder is **replaced** in-place by a `fabric.FabricImage` sized to exactly the placeholder's bounding box. The image is **clipped** to the placeholder's bounds via fabric `clipPath` so over-scan photos crop cleanly.
- **AC-5** — Replacement is non-destructive of layer order — the new image inherits the placeholder's `layerId` so undo/redo still works through the existing `HistoryService`.
- **AC-6** — A frame-image (already filled) can be replaced by clicking it and selecting a different photo. Same mechanic as AC-4.
- **AC-7** — Frames can be moved, resized, and rotated like any other fabric object. The image's clipPath updates to match the placeholder's transform.
- **AC-8** — Empty `photo-frame` placeholders are visually distinct from filled ones (dashed border + "+" hint vs. solid image). Placeholder strokes are violet (`var(--px-violet)`) so they read as Pixelforge brand surfaces, not Material defaults.
- **AC-9** — TSDoc on every new public symbol (per `project-context.md` §6).
- **AC-10** — Unit tests cover: preset registry (8 presets shape), `addFrameLayout()` adds N objects with `customType: 'photo-frame'`, `replaceFrameWithImage()` swaps the placeholder while preserving layerId, file-input MIME guard rejects non-image files.

## Tasks / Subtasks

- [ ] **T-1 · Frame preset registry**
  - [ ] Create `pixelforge/src/app/core/data/frame-presets.ts` exporting `FRAME_PRESETS: readonly FramePreset[]`. Each preset has `{ id, name, icon, slots: ReadonlyArray<{ x, y, w, h, rotation? }> }` where coordinates are normalized 0..1 (multiplied by canvas dimensions at insert time).
  - [ ] Add unit test asserting all 8 presets exist with non-empty `slots`.
- [ ] **T-2 · CanvasService extension**
  - [ ] `addFrameLayout(preset: FramePreset): void` — creates N empty placeholders, adds each to the canvas with `(obj as any).customType = 'photo-frame'` and a stable `layerId`.
  - [ ] Empty placeholder = `fabric.Group` containing a dashed-stroke Rect + a centered "+" Text label. Group is movable as a unit.
  - [ ] `replaceFrameWithImage(frame: fabric.Object, imageUrl: string): Promise<void>` — loads the image, creates a `FabricImage` at the frame's bounds with a `clipPath` matching the frame, swaps it into the canvas at the frame's index, preserves `layerId`.
  - [ ] Tests for both methods using the existing fabric mock pattern.
- [ ] **T-3 · Sidebar drawer Frames tab**
  - [ ] New rail-btn between Elements and Text: `<button … (click)="toggleTab('frames')">… Frames`.
  - [ ] New drawer-panel branch listing the 8 presets as cards. Each card renders a tiny CSS-only preview of the layout (uses `flexbox` + `transform` to draw the slot rectangles inside a 100×100 swatch).
  - [ ] Click a card → emit `addFrameLayout(preset)` to the editor → calls `CanvasService.addFrameLayout`.
- [ ] **T-4 · Click-to-fill behavior**
  - [ ] In `editor.ts` (or a small new directive), bind a `mouse:up` listener on the canvas. If the clicked target has `customType === 'photo-frame'`, open a hidden file input with `accept="image/*"`. On change, validate MIME, read as DataURL, call `CanvasService.replaceFrameWithImage`.
  - [ ] Same logic should work for already-filled frames (re-click to replace).
- [ ] **T-5 · Visual polish**
  - [ ] Empty placeholder dashed stroke uses `var(--px-violet)` at low opacity so it reads as a Pixelforge surface.
  - [ ] "+" hint icon centered inside placeholder.
- [ ] **T-6 · TSDoc on every new public symbol.**

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/core/data/frame-presets.ts` | new |
| `pixelforge/src/app/core/data/frame-presets.spec.ts` | new |
| `pixelforge/src/app/core/services/canvas.service.ts` | modified (`addFrameLayout`, `replaceFrameWithImage`) |
| `pixelforge/src/app/core/services/canvas.service.spec.ts` | modified |
| `pixelforge/src/app/features/editor/components/sidebar-drawer.ts` | modified (Frames tab + preset cards) |
| `pixelforge/src/app/features/editor/editor.ts` | modified (click-to-fill listener + hidden file input) |

## Definition of Done

All ACs met. Tests green (FE + BE). `tsc --noEmit` clean. Manual smoke: open `/editor/:id`, click Frames in the sidebar, drop a 2x2 grid → 4 dashed placeholders appear; click one → file picker; pick a JPG → image replaces the placeholder, clipped to its bounds; resize the group → image scales with the frame.
