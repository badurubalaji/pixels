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
- [ ] **C1.** Add a Rectangle from the sidebar Shapes panel. Drag it. Resize it. Rotate it. The PX-141 floating context toolbar appears pinned at the top-center of the canvas viewport (PX-148 absolute placement). Toolbar shows the **shape** verb set: Bring to front · Send to back · Delete.
- [ ] **C2.** Add a Text. Edit font, size, color, bold/italic/underline via the right property panel. The floating context toolbar swaps to the **text** verb set: Bold · Italic · Underline · Bring to front · Send to back · Delete (PX-141).
- [ ] **C3.** Click an empty area of the canvas. Right property panel switches to a "Page background" editor (PX-113). Pick a quick-color swatch — canvas color changes. Drag the Transparency slider — canvas alpha changes (PX-115).
- [ ] **C4.** With a shape selected, scroll the right panel — there's also a "Page background" expansion-panel at the end (PX-116). Open it and confirm the same controls work without deselecting.
- [ ] **C5.** Top-right of the canvas: the new **Page background** palette button (PX-152) opens a menu with White / Transparent / Color. Picking Transparent shows the dark canvas-area through the wrapper (PX-153 — replaced the prior checkerboard that was visually confused with viewer transparency hints).
- [ ] **C6.** Select multiple objects (drag-select). Floating toolbar swaps to the **group** verb set: Group · Ungroup · Bring to front · Send to back · Delete (PX-141). Click an open toolbar verb — the selection survives (PX-148/149/150 deselect-on-click guards).
- [ ] **C7.** Add an image. Floating toolbar shows the **image** verb set with **Remove Background** as the primary gradient button (PX-141). Property panel also shows a Remove Background quick action and a **Magic Eraser** button (PX-138 + PX-151).
- [ ] **C8.** Delete the selected object via the toolbar's trash icon. The toolbar disappears (PX-145 object:removed re-sync).

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

## G. Editor — floating context toolbar + context menu
- [ ] **G1.** The floating context toolbar (PX-141) is **always pinned to the top-center of the canvas viewport** — does NOT track the selected object up/down. (PX-148 changed from object-relative to canvas-anchored placement.)
- [ ] **G2.** Click any verb on the toolbar (Remove Background, Bold, Front, Delete) — the active selection is preserved through the click (PX-148/149/150 cumulative fix to the document-level + canvas-area mousedown deselect handlers).
- [ ] **G3.** Select a frame near the canvas BOTTOM and right-click — context menu opens UPWARDS so all menu items are visible (PX-106 viewport clamp).
- [ ] **G4.** Toolbar hides when nothing is selected, including after deleting an object via Delete key, toolbar trash icon, layer-panel delete, or right-click → Delete (PX-145 object:removed re-sync).

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
- [ ] **J4.** Set canvas background to Transparent via PX-152 menu. Export PNG with **Transparent background ON**. Drop the file onto a colored web page or Figma frame — the transparent regions show the backdrop through, no checkerboard data in the file (PX-153 also strips canvas.backgroundImage in transparent export).
- [ ] **J5.** Same export with **Transparent background OFF** — PNG includes whatever color/pattern the canvas has.

## L. Editor — image cleanup tools (PX-138/151)
- [ ] **L1.** Add an image with a clear bg (e.g. logo on white). Click **Remove Background** in either the floating toolbar OR the property panel. After ~1-3s the bg is replaced with transparent (PX-138 + PX-142 — captured at natural resolution so resizing afterward stays sharp).
- [ ] **L2.** Resize the bg-removed image up to ~2× original. Edges stay crisp (PX-142 multiplier=1/scaleX).
- [ ] **L3.** If the AI left bg halo or shadow patches, click **Magic Eraser** in the property panel. Click any leftover patch on the canvas — the flood fill clears the contiguous color region (PX-151). Repeat clicks to clean multiple spots; tweak the Tolerance slider (4-120). Esc exits.
- [ ] **L4.** Re-open the project after edits — the bg-removed image's transparency persists (PX-143 inject crossOrigin on load + PX-147 preserve canvasJson on backend list-sync).

## M. Editor — refresh / nav-away persistence (PX-144/146/147)
- [ ] **M1.** Resize an image, immediately hit F5. Image stays resized (PX-144 1s debounce + beforeunload flush).
- [ ] **M2.** Edit something, navigate to /hub via Home button, click the same project. Edit is preserved (PX-147 fix to mergeProjects nullish-preserve).
- [ ] **M3.** Edit, close the tab, reopen `/editor/{id}`. Edit is preserved.

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
- 2026-04-26 — Sprint-27. Backend pytest 95/95 green; frontend vitest 499/499 green. Added sections C5-C8 (PX-141 floating context toolbar verb sets + PX-152 canvas-bg menu + PX-145 hide-on-delete), reworked G (toolbar now canvas-anchored not object-relative), added L (PX-138 Remove Background + PX-151 Magic Eraser cleanup) and M (PX-144/146/147 persistence). Code-level coverage added for cropMode + smartCrop in canvas.service.spec.ts and property-panel.spec.ts. Browser walkthrough still pending.
- 2026-04-26 — PX-074 verified end-to-end against the live running BE + Mongo via direct API (signup → wrong-pw 401 → same-email 400 → happy 204 → bad-token 400 → real-token confirm 200 → /me reflects new email). Plus 10/10 pytest unit coverage. Real Resend delivery is a deployment-time setup item (RESEND_API_KEY env var), not a code item; the OUTBOX dev fallback works as designed.
