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

- [ ] **T-1 · Sally provides sketches** (~1 day design time).
  - [ ] 20 thumbnails of the intended templates (pencil / Figma sketches acceptable).
  - [ ] Each labeled with platform, tag family, palette slots.
  - [ ] Reviewed by Amelia for fabric.js-renderability feasibility.
- [ ] **T-2 · Author canvas JSON**
  - [ ] For each template, open the existing editor, design, then `CanvasService.getCanvasJSON()` to export.
  - [ ] Save as `<stem>.json` in `backend/app/seed/assets/templates_canvas_json/`.
- [ ] **T-3 · Generate thumbnails**
  - [ ] For each, `canvas.toDataURL('image/png')` at 300×300 OR fabric `.toDataURL({ format:'png', multiplier: 0.3 })`.
  - [ ] Save as `<stem>.png` in thumbnails dir.
- [ ] **T-4 · Palette slot annotation**
  - [ ] Per template JSON, annotate which object fills are Brand Kit palette slots.
- [ ] **T-5 · Metadata**
  - [ ] Per template, a small `<stem>.meta.json` with name, platform, tags, palette_slots, font list, license notes.
- [ ] **T-6 · Integration test**
  - [ ] `backend/tests/test_templates_seed_content.py` — after seed, assert 20 documents exist with expected platform distribution.
- [ ] **T-7 · Sally's visual review** — 30-min pass before PR merge.

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
