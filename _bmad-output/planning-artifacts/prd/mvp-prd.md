# Pixels MVP — Product Requirements Document

**Author:** John (Product Manager), dispatched by Orion
**Date:** 2026-04-24
**Status:** Draft for review
**Depends on:** `../vision/north-star-vision.md`, `../ux-spec/ux-wireframe-spec.md`

---

## 1. Product Positioning (one sentence)

> **Pixels is a free, self-hosted personal social-media content studio that lets a single user produce Instagram/LinkedIn/YouTube-ready posts and logos — including cleaning up AI-generated logo concepts — in under five minutes per artifact.**

This is **not** a Canva clone. It is a personal studio scoped to social-media content and logo work. The full Canva surface (video, docs, presentations, whiteboards) is north-star ambition only — see `../vision/north-star-vision.md` §3 for the explicit non-goals.

---

## 2. Personas

### Primary — Priya, Solo Creator / Small-Business Operator
- Runs a small business or side project (tiffin service, podcast, consultancy).
- Posts to Instagram + LinkedIn ~3-5×/week.
- Uses Canva free tier today; hits the paywall ~weekly for background remover, magic resize, brand kit limits, or template access.
- Refuses to pay Canva $15+/month for features she uses in bursts.
- Sometimes generates logo concepts in Midjourney / DALL-E / Leonardo and needs to clean them up to a usable form.

### Secondary — Ashulabs Household Internal Use
- Multiple family / team members sharing one self-hosted instance.
- Each has their own Brand Kit.
- Low collaboration needs beyond existing comments feature.

### Out-of-scope personas (deferred)
- Enterprise teams needing RBAC and audit logs.
- Video editors.
- Print designers needing CMYK + bleed.
- Agencies managing dozens of client brands.

---

## 3. Jobs To Be Done (MVP-scoped)

### JTBD 1 — "Ship a social post in under 5 minutes"
*When* I have an announcement or post idea,
*I want to* pick a platform template with my brand already applied,
*so I can* publish on-brand content without designing from scratch.

### JTBD 2 — "Create a logo for a new project"
*When* I'm starting a new brand/side project,
*I want to* design a simple logo from scratch using shapes and typography,
*so I can* have a usable identity without hiring a designer.

### JTBD 3 — "Clean up an AI-generated logo"
*When* I've generated a logo concept in an AI tool,
*I want to* remove its background, vectorize it, recolor it to my brand palette, and export multi-size,
*so I can* use it as my actual logo (favicon, app icon, social avatar, print).

### JTBD 4 — "Maintain brand consistency across all my content"
*When* I make any content in pixels,
*I want* my brand colors / fonts / logo to auto-apply,
*so that* everything I ship looks cohesive without manual overrides.

---

## 4. User Stories — MVP

Stories are grouped by epic. Each story is sized T-shirt (S, M, L) and marked IN-MVP or DEFERRED.

### Epic A — Foundation Hardening (Sprint 0–1)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-001 | As Amelia, I need a Vitest test baseline on god-nodes (`CanvasService`, `Editor`, `ApiService`) so regressions are detectable. | M | P0 |
| PX-002 | As Amelia, I need `get_db()` called via `Depends(get_db)` in every backend route, per project-context.md §5.1. | S | P0 |
| PX-003 | As a user, I want my uploaded brand logo to export as SVG (not just PNG) so I can use it at any size. | S | P1 |

### Epic B — Content Hub & Navigation (Sprint 1)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-010 | As a user, I see a 6-tile Hub (`/hub`) with IG Post, IG Story, LinkedIn Post, LinkedIn Banner, YouTube Thumbnail, Logo when I open the app. | M | P0 |
| PX-011 | As a user, the Hub is the default post-login landing page (not a blank dashboard). | S | P0 |
| PX-012 | As a user, tapping a Hub tile navigates me to `/gallery/:type` for that content type. | S | P0 |

### Epic C — Platform Size Presets & Template Gallery (Sprint 1–2)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-020 | As Amelia, I audit the existing `ExportService.applyPlatformPreset()` and add any missing platform sizes: IG Post 1080×1080, IG Story 1080×1920, LinkedIn Post 1200×627, LinkedIn Banner 1584×396, YT Thumb 1280×720. | S | P0 |
| PX-021 | As a user, when I pick a platform from the Hub, the editor opens at the correct canvas dimensions with no manual resize. | M | P0 |
| PX-022 | As an admin/me, I can seed 20 starter templates (mix of IG post, IG story, LinkedIn post) into the backend `template_routes.py`. | M | P0 |
| PX-023 | As a user, the `/gallery/:type` page shows template thumbnails pre-rendered with my Brand Kit colors. | L | P1 |
| PX-024 | As a user, I can filter the gallery by tags (Bold / Minimal / Festive / Corporate). | S | P2 |
| PX-025 | As a user, I have a one-click "Resize for IG Story" action from an open IG Post, producing a correctly-sized derivative with smart reflow. | L | P2 |

### Epic D — Logo Creator Mode (Sprint 2)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-030 | As a user, I can choose between "Start from scratch" and "Clean up an AI logo" at `/logo/mode-chooser`. | S | P0 |
| PX-031 | As a user, Logo Creator ships with a shape library of ~30 primitives in a sidebar I can drag onto canvas. | M | P1 |
| PX-032 | As a user, Logo Creator suggests typography pairings via extended `DesignHelperService.getFontPairings()`. | S | P1 |
| PX-033 | As a user, my Brand Kit colors appear as swatches in Logo Creator. | S | P1 |
| PX-034 | *DEFERRED to v1:* SVG boolean operations (union / subtract / intersect). | L | v1 |

### Epic E — Logo AI-Cleanup Mode (Sprint 2–3)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-040 | As a user, I can drop a PNG/JPG/WebP/SVG of an AI logo onto the Cleanup stepper. | S | P0 |
| PX-041 | As a user, Cleanup automatically removes the image background using existing `BackgroundRemovalService`. | S | P0 |
| PX-042 | As a user, Cleanup vectorizes the raster to SVG client-side via `imagetracerjs` with a quality slider. | M | P0 |
| PX-043 | As a user, Cleanup optimizes the SVG via `svgo` (path simplification). | S | P1 |
| PX-044 | As a user, Cleanup offers "Snap to Brand Kit" recolor — every fill/stroke maps to nearest Brand Kit color, with per-color overrides. | M | P1 |
| PX-045 | As a user, after Cleanup I can freely edit in the Logo Creator surface. | S | P0 |
| PX-046 | As a user, I can skip any step in the Cleanup stepper (e.g., if BG already transparent). | S | P1 |

### Epic F — Multi-Format Export (Sprint 2)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-050 | As a user, I can export SVG natively from the editor (via `fabric.js.toSVG()`). | S | P0 |
| PX-051 | As a user, I can export transparent PNG at multiple sizes (512/256/128/64/32). | S | P0 |
| PX-052 | As a user, I can export an ICO multi-resolution file (16/32/48/64/128/256) for favicons and app icons. | M | P1 |
| PX-053 | As a user, I can see a contrast-check preview of my logo against light/dark/brand backgrounds before exporting, using existing `AccessibilityService`. | S | P2 |

### Epic G — Brand Kit Integration (Sprint 2)

| ID | Story | Size | Priority |
|----|-------|------|----------|
| PX-060 | As a user, when I open a template, my Brand Kit colors auto-apply to template palette slots, with a toast "Applied your Brand Kit. Undo?" | M | P0 |
| PX-061 | As a user, my Brand Kit fonts are offered as defaults in any text element. | S | P1 |
| PX-062 | As a user, my Brand Kit logos appear in a dedicated section of the Logo Creator / Cleanup sidebars. | S | P1 |

---

## 5. Acceptance Criteria — "MVP Done"

The MVP is considered shipped when **all P0 stories above pass their ACs**, **all tests green**, **all new/changed public symbols have docstrings** (per project-context.md §6), and the success scenario is demonstrable:

> Success scenario (measurable): *A new user, following no docs, opens pixels, picks "Instagram Post" from the hub, selects a template, edits the main headline text, drops in an existing logo, and exports a 1080×1080 PNG in under 5 minutes.*

Additionally:
- 0 test regressions on god-node tests.
- All new features documented in the story's `Dev Agent Record`.
- Graphify graph refreshed post-merge.
- Accessibility: WCAG AA contrast on all new screens.

---

## 6. Non-Functional Requirements

| NFR | Requirement |
|-----|-------------|
| Performance | Hub load < 500ms on fast 3G. Editor open < 1.5s with template pre-applied. Vectorize (typical logo ~500KB PNG) < 3s client-side. |
| Browsers | Latest Chrome, Firefox, Safari, Edge. PWA-installable via existing service worker. |
| Accessibility | WCAG AA minimum. Keyboard-navigable. Screen-reader labels on every interactive element. |
| Privacy | All processing client-side where possible. Uploaded images stored in `backend/uploads/` on the self-hosted instance; never sent to third parties. |
| Security | OWASP Top 10. File-upload validation (MIME sniff, size limits, Pillow `verify()`). JWT with ≤ 15-min access TTL per project-context.md §5.3. |
| Self-hosting | Docker Compose up. No external SaaS dependencies for MVP features. |

---

## 7. New Runtime Dependencies

Per project-context.md §R6, each requires explicit approval. Orchestrator-log captures user's implicit approval via "start creating PRD, wireframes, ARD, epics, and stories. make sure all done."

| Package | License | Size | Purpose |
|---------|---------|------|---------|
| `imagetracerjs` | MIT | ~60KB | Client-side raster → SVG tracing for Logo AI-Cleanup |
| `svgo` | MIT | ~300KB dev-dep or client bundle, lazy-loaded | SVG path simplification |
| `png-to-ico` | MIT | ~30KB | Multi-resolution ICO export |

**Deferred / rejected:**
- `paper.js` (booleans) — deferred to v1. Logo Creator MVP uses layered shapes.
- `vtracer` (server-side tracer) — deferred to v1. `imagetracerjs` covers MVP quality.

---

## 8. Out of MVP Scope (explicit non-goals)

Everything in `../vision/north-star-vision.md` §3, reiterated: no video editing, no doc/docx editing, no PDF editing beyond existing export, no presentations, no whiteboards, no websites, no print-on-demand, no third-party stock library integration, no team-level permissions beyond current auth.

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vectorize quality disappoints for photographic / complex AI logos | User feels cleanup pipeline is broken | Ship quality slider (visible control); educate via UI copy; plan v1 upgrade to `vtracer` |
| Template gallery feels thin at 20 templates | "This is empty" feedback | Seed with 20 DIVERSE templates across styles; add "Start from scratch" as always-visible escape |
| Scope creep when users ask for "just one more Canva feature" | Shipping slips | Orion escalation rules enforce rejection; project-context.md §2 scope discipline |
| Brand Kit auto-apply produces ugly color mapping | Users turn it off and never trust it again | Always show a non-blocking toast with "Undo" affordance; remember user preference |
| Logo export format ICO requires server-side helper if client-only approach fails | Export broken | Keep `png-to-ico` client-side; fallback to Pillow `ImageDraw` server-side if needed |

---

## 10. Reviewer sign-off

| Reviewer | Role | Status |
|----------|------|--------|
| John | Self-review | ✅ |
| Sally | UX alignment | ⏳ pending |
| Winston | Technical feasibility | ⏳ pending |
| Mary | Competitive positioning | ⏳ pending |
| Amelia | Story executability | ⏳ pending |
| Orion | Scope + decision log alignment | ⏳ pending |
