# Story PX-096 — Independent in-frame photo rotation

**Epic:** I — Editor power-features
**Sprint:** 17 (deferred from sprint-15/16)
**Size:** L
**Priority:** P2 (UX polish; sliders + frame-handle rotation already cover most intent)
**Status:** Spec'd; not started
**Depends on:** PX-090 (photo-frames), PX-091 (fit modes), PX-094 (in-frame pan/zoom)

---

## Context

PX-095 added a Rotate slider to the "Photo in frame" property-panel section, but it drives `frame.angle` directly — rotating the entire frame group (slot + photo together). Some users want a different gesture: rotate the **photo within the slot** while the slot itself stays upright (e.g. to straighten a tilted scan, or to add a slight artistic tilt without affecting the layout).

This requires restructuring the frame from a flat `FabricImage` (today) to a Group with a rectangular `clipPath` and an inner `FabricImage` that carries its own angle independent of the group.

---

## Acceptance Criteria

- **AC-1** — A new "Photo tilt" slider (range -45° to +45°, step 1°) appears in the property-panel's "Photo in frame" expansion-panel below the existing Rotate slider, only when a filled photo-frame is selected.
- **AC-2** — Dragging the Photo tilt slider rotates the inner image within the frame's clip rectangle. The frame's outer bounds, position, and `frame.angle` are unchanged. Visually: the photo tilts inside its slot; the slot's edges stay where they were.
- **AC-3** — The existing Rotate slider continues to drive frame-group rotation (slot + photo together).
- **AC-4** — On `replaceFrameWithImage`, the new photo inherits the frame's previous `photoAngle`. (Replacement preserves the user's tilt choice — they don't have to re-tilt every photo.)
- **AC-5** — `setFrameView` (pan/zoom) honors `photoAngle` — the cover-mode crop math accounts for the rotated source so panning / zooming still produces the expected visual result.
- **AC-6** — Save → reload round-trip preserves `photoAngle` (added to the `getCanvasJSON` include-list — see PX-101 for the established pattern).
- **AC-7** — Empty placeholders (no image yet) hide the Photo tilt slider; it only renders for filled FabricImage frames.
- **AC-8** — TSDoc on every new public symbol.
- **AC-9** — Unit tests cover: photo-tilt math (image angle = group.angle + photoAngle), replacement preserves photoAngle, persistence round-trip.

## Architecture decision — Group + clipPath restructure

Today's filled frame is a flat `fabric.FabricImage` with `customType: 'photo-frame'`, sized via `cropX/cropY/scaleX/scaleY` to match the slot's drawn rectangle. There's no nesting — the image IS the frame.

To support independent photo rotation, restructure the filled frame to:

```
fabric.Group
├── customType: 'photo-frame'
├── clipPath: fabric.Rect (centered at group origin, fw × fh — masks
│                          rotated photo to the slot's bounds)
└── children:
    └── fabric.FabricImage
         ├── angle: photoAngle  (independent of group.angle)
         ├── cropX, cropY, scaleX, scaleY  (existing cover/contain/fill math)
         └── width, height  (existing srcW/srcH)
```

**Why a Group with `clipPath` (not `absolutePositioned: true` on a flat image's clipPath):**
- Group's clipPath is in **group-local coordinates**, so it rotates with the group automatically. When the user drags the rotation handle (frame rotation), the clip mask follows.
- The inner image's `angle` is **relative to the group**, so it rotates within the clip without the clip rotating with it.
- absolutePositioned on a flat image would require updating the clip's position/angle every time the frame moves or the parent rotates — fragile.

### Math

Let:
- `frameAngle` = group.angle (slot orientation)
- `photoAngle` = inner image.angle (relative to group)

Combined orientation in canvas coords = `frameAngle + photoAngle` for the visible photo content. The clip rectangle stays at `frameAngle` only (it's a child of the group's coordinate space).

For `setFrameView` cover math, all calculations stay in the **inner image's frame** — `cropX/Y` and scale are unchanged. The pan deltas in PX-099 (canvas-pixel → pan-unit) also need to account for `photoAngle`: a horizontal cursor drag in canvas space corresponds to a rotated drag in the photo's reference frame. Concretely:

```
const phi = (group.angle + photoAngle) * π / 180;
const dxImage =  cos(phi) * dx + sin(phi) * dy;
const dyImage = -sin(phi) * dx + cos(phi) * dy;
// Then apply existing cover-pan math to (dxImage, dyImage).
```

### Migration considerations

- **Existing flat FabricImage frames** must be migrated to the Group form on load. In `loadFromJSON`, detect `customType === 'photo-frame' && obj instanceof FabricImage` and wrap the image in a Group with the appropriate clipPath. Or accept that old frames stay flat (and rotate group+photo together as before) and only NEW frames get the Group form. Latter is safer.
- **`replaceFrameWithImage`** needs two paths: replace inside an existing Group (swap the inner FabricImage), or replace the flat image (legacy path; possibly migrate to Group at the same time).
- **`setFrameFit`** must update the inner image, not the Group.
- **`setFrameView`** same.
- **`applyFramePanDelta`** same; plus the rotation correction in math above.
- **`removeActiveObject`** still works (Group removal is identical).
- **Click-to-fill** detector: target may be the Group or one of its children; need to walk up to find the photo-frame Group.

## Tasks / Subtasks

- [ ] **T-1 · CanvasService refactor**
  - [ ] `replaceFrameWithImage` produces a Group-wrapped frame for new fills.
  - [ ] `setFrameFit`, `setFrameView`, `applyFramePanDelta`: navigate to inner image; apply math; preserve `photoAngle`.
  - [ ] New `setFramePhotoAngle(frame, angle)` method.
- [ ] **T-2 · loadFromJSON migration heuristic**
  - [ ] Recognize legacy flat-image frames (`customType: 'photo-frame'` + `instanceof FabricImage`) and either leave alone OR wrap into Group form. Document the choice in the commit.
- [ ] **T-3 · Property-panel UI**
  - [ ] New "Photo tilt" slider (-45..45°) below the existing Rotate slider.
  - [ ] Bind to a `photoAngle` signal that mirrors `(active.getObjects()[0] as FabricImage).angle` for Group frames.
- [ ] **T-4 · Persistence**
  - [ ] Add `photoAngle` to `PERSISTED_CUSTOM_PROPS` in `getCanvasJSON` (or rely on the inner image's natural `angle` serialization since it's a built-in fabric prop).
- [ ] **T-5 · Tests**
  - [ ] Unit: photo-tilt math, replacement preserves angle, round-trip persistence.
- [ ] **T-6 · TSDoc**

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/core/services/canvas.service.ts` | modified (Group restructure across 4 methods) |
| `pixelforge/src/app/core/services/canvas.service.spec.ts` | modified (new tests) |
| `pixelforge/src/app/features/editor/components/property-panel.ts` | modified (new slider + signal + setter) |

## Why this is deferred

- **Scope creep risk.** Touching every photo-frame method in CanvasService is high-blast-radius. Sprint-15/16 stayed small to address the user-reported bugs (replace photo, qa-bar persistence, scroll, etc.). PX-096 deserves its own focused sprint.
- **Workaround already viable.** PX-095's Rotate slider + the frame's rotation handle together cover the common case of "rotate this whole element." The independent-photo-rotation use case is genuine but less frequent — most users want the whole composition to tilt as one unit.
- **PX-101 (custom-prop persistence) needs to land first** so the new `photoAngle` round-trips cleanly without a follow-up serialization fix.

When the user flags this as needed, dust off this story and execute T-1 through T-6.
