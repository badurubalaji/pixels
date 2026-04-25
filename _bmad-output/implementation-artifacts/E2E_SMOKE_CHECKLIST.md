# Pixels — Browser E2E Smoke Checklist (PX-077)

This checklist replaces the deferred "manual e2e" story. Backend pytest covers the API surface; this list covers the UI flows that need a human + browser to verify. Run through it after any sprint that touches the editor, hub, or auth.

**Setup**
- Backend: `cd pixelforge/backend && ./.venv/bin/python run.py` (port 8000)
- Frontend: `cd pixelforge && npx ng serve --port 4201`
- Browser: open `http://localhost:4201` in Chrome / Firefox.

---

## A. Auth + Hub
- [ ] **A1.** Open `/login`, click "Show password" toggle — password field reveals.
- [ ] **A2.** Sign up with `dev@pixels.dev` / `DevPass2026!`. Lands on `/hub`.
- [ ] **A3.** Logout (top-right avatar menu). Login again with same creds. Same projects appear.
- [ ] **A4.** Hub recent-projects thumbnails are SHARP, not blurry (PX-119 — should be WebP @ multiplier 0.6, ~480x360 for an 800x600 canvas).

## B. Hub gallery
- [ ] **B1.** Hub renders 18 platform-preset tiles + 1 Logo tile (PX-120). Spot-check: Instagram Post, Facebook Post, TikTok Video, Pinterest Pin, Presentation 16:9, A4 Document, Business Card.
- [ ] **B2.** Click any tile → `/gallery/{slug}` opens with Brand-Kit pre-rendered template thumbnails.
- [ ] **B3.** Click a template → Editor opens with that template applied.
- [ ] **B4.** Click Logo tile → routes to `/logo/mode-chooser`, NOT a gallery.

## C. Editor — basic objects
- [ ] **C1.** Add a Rectangle from the sidebar Shapes panel. Drag it. Resize it. Rotate it. Floating toolbar appears above the rect with format controls + align / group / lock / duplicate / delete (PX-104 single-toolbar consolidation).
- [ ] **C2.** Add a Text. Edit font, size, color, bold/italic/underline. Floating toolbar shows text controls in the same single bar.
- [ ] **C3.** Click an empty area of the canvas. Right property panel switches to a "Page background" editor (PX-113). Pick a quick-color swatch — canvas color changes. Drag the Transparency slider — canvas alpha changes (PX-115).
- [ ] **C4.** With a shape selected, scroll the right panel — there's also a "Page background" expansion-panel at the end (PX-116). Open it and confirm the same controls work without deselecting.

## D. Editor — photo frames (collage)
- [ ] **D1.** Sidebar → Elements tab → Photo frames section. Sub-categories visible (PX-121): **Grids · Filmstrips · Polaroid · Hero layouts · Shapes**.
- [ ] **D2.** Pick a Grid layout (e.g. `2 × 2 grid`). It lands on the canvas with 4 dashed-stroke placeholders + "+" sign.
- [ ] **D3.** Click an empty placeholder → file picker opens. Pick a photo. Photo appears clipped to that slot (PX-090/091).
- [ ] **D4.** Right property panel shows "Photo in frame" with: Aspect chips (Freeform · Original · 1:1 · 4:3 · 16:9 · 3:4 · 9:16), Smart Crop button, Shape selector (rect · rounded · circle · hexagon · star · heart), pan-X / pan-Y / zoom / rotate / photo-tilt sliders.
- [ ] **D5.** Click an Aspect chip — frame reshapes; photo refits (PX-108).
- [ ] **D6.** Click "Original" chip — frame matches photo's natural aspect (PX-109). Click "Smart Crop" — instant auto-fit (PX-109/123).
- [ ] **D7.** Right-click a filled frame — context menu shows "Replace photo" + "Reset crop & zoom" (PX-100/102) + standard items.
- [ ] **D8.** Right-click a regular image (non-frame) — menu shows "Make photo frame" (PX-102 recovery).
- [ ] **D9.** Save project (Ctrl+S or topbar Save). Reload page. Photo frames + filled photos persist (PX-101 + PX-112). Backend logs should show no DocumentTooLarge errors (PX-112 routes images through /api/assets/upload instead of inlining base64).

## E. Editor — undo / redo
- [ ] **E1.** Add 3 shapes. Ctrl+Z three times — all undone. Ctrl+Shift+Z three times — all redone (PX-114 history fix).
- [ ] **E2.** Add a frame, fill it, change shape via the shape selector — Ctrl+Z reverts to prior shape. customType is preserved across undo (was the user-flagged regression in PX-114).
- [ ] **E3.** Drag pan-X slider on a filled frame — release. One Ctrl+Z reverts the pan in one step, not many (PX-114 slider commit-on-release).

## F. Editor — alignment + snapping
- [ ] **F1.** Drag a shape close to canvas center → magenta center guide appears, shape snaps. (PX-107)
- [ ] **F2.** Drag a shape close to another shape's left edge → guide appears, shape snaps to edge-to-edge. (PX-107 edge-snap)
- [ ] **F3.** Hold Alt while dragging — snap is disabled. Release Alt — snap engages again. (PX-107 escape hatch)
- [ ] **F4.** Zoom canvas to 4× via the zoom slider — snap pull radius stays ~6 screen pixels (not 24). (PX-107 zoom-aware)

## G. Editor — single-toolbar + context menu
- [ ] **G1.** Select an object near the canvas top — floating toolbar appears BELOW it (auto-flip).
- [ ] **G2.** Select an object lower on the canvas — floating toolbar appears ABOVE it (default).
- [ ] **G3.** Select a frame near the canvas BOTTOM and right-click — context menu opens UPWARDS so all menu items are visible (PX-106 viewport clamp).
- [ ] **G4.** Single floating toolbar only — no separate quick-action-bar (PX-104 consolidation).

## H. Editor — multi-page
- [ ] **H1.** Click "+ Add page" below the canvas. Switch between pages. Each page's content persists per page.
- [ ] **H2.** Delete a page via the page-bar. Confirm the rest stays.

## I. Responsive
- [ ] **I1.** Resize browser to ≤1100px width — right property panel narrows to 240px but stays visible (PX-118).
- [ ] **I2.** Resize to ≤768px — sidebar collapses to bottom sheet; right panel becomes a slide-over from the right edge (PX-118). Object selection still drives toolbar + property edits.
- [ ] **I3.** Resize to ≤480px — Home button + Share button hide. Editor still usable for basic edits.

## J. Export + share
- [ ] **J1.** Topbar → Export. Pick PNG. File downloads.
- [ ] **J2.** Pick PDF (multi-page). Each page becomes one PDF page.
- [ ] **J3.** Topbar → Share → Get a public link. Open in an incognito window — read-only canvas renders.

## K. Account
- [ ] **K1.** Top-right avatar menu → Profile → change Name. Saved on Save.
- [ ] **K2.** Profile → Change password. Old password verified, new password length-checked, success snackbar.
- [ ] **K3.** Profile → Change email (PX-074). Enter new email. Snackbar: "Confirmation link sent to <new email>." Open the email inbox of the new address. Click the confirm link. Email updated; old email can no longer log in.

---

**Acceptable yellows.** The following are NOT regressions and should not block sign-off:
- Smart Crop is heuristic only; does not detect human faces (PX-123 saliency uses edge density not ML; no TF.js dep).
- Devices + Paper frame categories ship pure-geometry shapes only; no rendered phone bezels or torn-paper textures.
- Crop modal-mode is the new transient Crop tool launched by an explicit Crop button on the floating toolbar (PX-122) — the old always-visible "Photo in frame" panel still appears in the right panel, but the modal is the recommended workflow.

**Run tracking.** Keep a dated note at the bottom of this file when this checklist is run end-to-end. If any item fails, file a story and link it from the failing line.

---

### Run log
- 2026-04-25 — backend pytest 85/85 green; frontend tests 448/448 green; build clean. Browser walkthrough deferred to next session.
