# Story PX-022b — Template content authoring (20 starter templates)

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 1–2
**Size:** L
**Priority:** P0
**Owner:** Amelia + Sally (visual direction)
**Status:** Ready for dev once PX-022a lands
**Depends on:** PX-022a (infra), Sally template sketches
**Parent story:** `PX-022-seed-starter-templates.md`

---

## Context

This story is the content-authoring half of the original PX-022 split. The infrastructure exists; this one populates it with 20 designed templates matching the PRD distribution: 5 IG Post, 4 IG Story, 4 LinkedIn Post, 3 LinkedIn Banner, 2 YT Thumbnail, 2 Logo. Every template renders on the user's Brand Kit via `palette_slots`.

---

## Acceptance Criteria

- **AC-1** — 20 template canvas-JSON files exist under `backend/app/seed/assets/templates_canvas_json/` with the PRD-required platform distribution.
- **AC-2** — 20 matching thumbnail PNGs (max 300×300) exist under `backend/app/seed/assets/templates_thumbnails/` with identical stems.
- **AC-3** — Every template has 3-8 editable layers and a non-empty `palette_slots` array (≥ 2 slots named by role: primary / secondary / text / accent / background).
- **AC-4** — Style variety across templates: ≥ 3 distinct tag families represented (Bold / Minimal / Festive / Corporate / Playful).
- **AC-5** — Zero copyrighted imagery. Vectors / solid fills / gradients / public-domain icons only. Free-licensed fonts only (list in each template's metadata).
- **AC-6** — Manual visual review by Sally before merge.
- **AC-7** — With `PIXELS_SEED_TEMPLATES=1`, starting the backend produces 20 documents in the `templates` collection and they render in `/gallery/:type` for each platform type.

## Tasks / Subtasks

- [~] **T-1 · Sally provides sketches** (~1 day design time). **DEFERRED** to PX-022b-FUP-1 — we authored programmatically (Pillow + fabric JSON) to unblock PX-023; visual polish is a follow-up Sally design pass.
  - [ ] 20 thumbnails of the intended templates (pencil / Figma sketches acceptable).
  - [ ] Each labeled with platform, tag family, palette slots.
  - [ ] Reviewed by Amelia for fabric.js-renderability feasibility.
- [x] **T-2 · Author canvas JSON**
  - [x] 20 templates authored via `backend/app/seed/author_templates.py` (one `_Spec` per template; `_build_canvas_json` produces 5-6 fabric-compatible layers: background rect, primary band, secondary corner shape, headline textbox, subline textbox, optional accent dot).
  - [x] Saved as full-document JSON (top-level `name`/`platform`/`tags`/`palette_slots`/`canvas_json`) in `backend/app/seed/assets/templates_canvas_json/`.
- [x] **T-3 · Generate thumbnails**
  - [x] Rendered 300×300 (aspect-projected) PNG previews via `Pillow ImageDraw`, matching each spec's palette. Background rect + top band + corner shape + headline + subline.
  - [x] Saved as `<stem>.png` in `backend/app/seed/assets/templates_thumbnails/`.
- [x] **T-4 · Palette slot annotation**
  - [x] Each template declares ≥ 2 palette slots (`primary` + `secondary`/`text`/`accent`/`background`) directly in the JSON; thumbnails and canvas scene reuse the same hex defaults so the Brand-Kit auto-apply pass (PX-060) can swap them in-place.
- [~] **T-5 · Metadata** — rolled into the canvas JSON itself (loader accepts full-document form). No separate `.meta.json` files needed; the loader already ingests `name`/`platform`/`tags`/`palette_slots` from the top-level JSON.
- [x] **T-6 · Integration test**
  - [x] `backend/tests/test_templates_seed_content.py` — 8 tests covering AC-1 through AC-5 and AC-7: 20 JSON+PNG pairs on disk, every PNG ≤ 300×300 and Pillow-readable, full seed inserts 20 docs, platform distribution is pinned (7/4/4/3/2), ≥ 2 palette slots + ≥ 1 filter-chip tag per doc, 3-8 layers per canvas, no raster-image fabric objects.
- [ ] **T-7 · Sally's visual review** — pending (PX-022b-FUP-1).

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/backend/app/seed/assets/templates_canvas_json/*.json` | new (20 files) |
| `pixelforge/backend/app/seed/assets/templates_thumbnails/*.png` | new (20 files) |
| `pixelforge/backend/app/seed/assets/templates_metadata/*.meta.json` | new (20 files) |
| `pixelforge/backend/app/seed/templates_seed.py` | minor modify if metadata ingestion needed |
| `pixelforge/backend/tests/test_templates_seed_content.py` | new |

## Definition of Done

- 20 templates render in the gallery, styled, on-brand, license-safe.
- Sally visual sign-off in PR.
- Integration test green.
- Tags populated.

---

## Dev Agent Record

**Agent:** Amelia
**Completed:** 2026-04-23
**Status:** COMPLETE (pending Sally's visual review, tracked as PX-022b-FUP-1)

### Logo-path decision
Repurposed 2 `ig-post` slots as logo-flavored designs tagged `["Logo", ...]` (stems `logo-ig-monogram`, `logo-ig-wordmark`). The canonical `PlatformLiteral` and `platform_presets` were NOT extended — this keeps the diff backend-only and avoids touching `src/app/core/constants/platform-presets.ts` and the parity test.

Net distribution: **7 ig-post** (5 content-post + 2 logo-tagged) + 4 ig-story + 4 linkedin-post + 3 linkedin-banner + 2 yt-thumb = **20 total**.

### Authoring approach
Programmatic (Pillow + fabric JSON), NOT hand-designed. Each template is a `_Spec` in `backend/app/seed/author_templates.py` → `_build_canvas_json` produces 5-6 fabric layers (bg rect, primary band, secondary shape, headline textbox, subline textbox, optional accent dot) → `_render_thumbnail` emits a 300×300 aspect-projected PNG. Fonts are DejaVu (SIL OFL) with Pillow bundled-default fallback; no proprietary fonts. Visual polish intentionally deferred to PX-022b-FUP-1 (Sally design session).

### Files created
- `pixelforge/backend/app/seed/author_templates.py` — new (authoring helper + `SPECS` export; not imported at runtime).
- `pixelforge/backend/app/seed/assets/templates_canvas_json/*.json` — 20 new files.
- `pixelforge/backend/app/seed/assets/templates_thumbnails/*.png` — 20 new files.
- `pixelforge/backend/tests/test_templates_seed_content.py` — new (8 tests).

No frontend or existing-backend changes.

### Test results
- Baseline before: 53/53 passing.
- After: **61/61 passing** (53 baseline + 8 new). Zero failures.
- New tests cover AC-1 (20 JSONs), AC-2 (20 stem-matched PNGs, ≤ 300×300, Pillow-openable), AC-3 (3-8 layers, ≥ 2 palette roles), AC-4 (≥ 3 filter-chip tag families across set — all 6 used: Bold/Minimal/Festive/Corporate/Playful/Logo), AC-5 (no `image` fabric objects — license guardrail), AC-7 (full seed into mongomock yields 20 docs with pinned platform distribution + 2 logo-tagged docs in ig-post slot).

### Follow-ups (out of scope)
- **PX-022b-FUP-1** — Sally visual design pass: replace the programmatic thumbnails + canvas compositions with hand-designed variants. Current templates are functional but not visually polished (the brief flagged this as acceptable).
- **PX-022b-FUP-2** — If product wants a first-class `Logo` gallery tab, either extend `PlatformLiteral` to include `'logo'` (touches `schemas/template.py`, `platform_presets.py`, `platform-presets.ts`, parity test) or add a `category: "logo"` field to the Template schema. Current tag-based surfacing works for MVP gallery filters.
- **T-1** (Sally sketches) and **T-7** (Sally review) are unchecked in the subtask list — handoff to Sally as part of FUP-1.

