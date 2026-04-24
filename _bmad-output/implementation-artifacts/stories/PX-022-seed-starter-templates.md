# Story PX-022 — Seed 20 starter templates

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 1
**Size:** M
**Priority:** P0
**Owner:** Amelia (+ Sally for template visual direction)
**Status:** SPLIT per revision-wave-1 — this file is the parent tracker; actual work lives in:
- `PX-022a-template-seed-infra.md` (infrastructure, M)
- `PX-022b-template-content-authoring.md` (the 20 designed templates, L)
**Depends on:** PX-020, Winston's ARD §8.1 (templates schema)

---

## Context

Per PRD §4 JTBD-1 and vision §2, templates are the moat. The MVP demands 20 starter templates spread across the 5 content types so that users landing on `/gallery/ig-post` see real content, not an empty state.

Winston's ARD §8.1 defines the `templates` collection schema. This story seeds it idempotently at backend startup.

---

## Acceptance Criteria

- **AC-1** — `backend/app/seed/templates_seed.py` exists with a function `async def seed_templates(db: AsyncIOMotorDatabase) -> int` that inserts 20 templates if and only if the `templates` collection is empty. Returns count inserted.
- **AC-2** — Template distribution: 5 IG Post, 4 IG Story, 4 LinkedIn Post, 3 LinkedIn Banner, 2 YT Thumbnail, 2 Logo.
- **AC-3** — Each template's `canvas_json` is a valid `fabric.js` scene with 3-8 editable layers and `palette_slots` array naming which fills participate in Brand Kit mapping.
- **AC-4** — Each template has a `thumbnail_data_url` pre-generated (PNG data URL, max 300×300).
- **AC-5** — Seeding runs on app startup via `lifespan()` in `backend/app/main.py`, but only if a new env var `PIXELS_SEED_TEMPLATES=1`. Default behaviour: do not auto-seed in test runs.
- **AC-6** — `GET /api/v1/templates?platform=<type>` returns templates filtered by type. If `platform` omitted, returns all.
- **AC-7** — Every template matches the schema in ARD §8.1. mypy strict passes.
- **AC-8** — pytest covers: empty-collection-first-seed, idempotent-second-seed (inserts 0), filter-by-platform, filter-by-tag.
- **AC-9** — Templates are copyrightable-safe: all imagery is pure vector / solid color / free-fonts only. No photos.

## Tasks / Subtasks

- [ ] **T-1 · Design templates (with Sally's input)**
  - [ ] Sketch 20 templates on paper or in Figma (1 day). Variety: Bold, Minimal, Festive, Corporate, Playful.
  - [ ] For each template, produce a `fabric.js` JSON dump via the existing editor (open editor → design → export JSON via `CanvasService.getCanvasJSON()`).
  - [ ] Store in `backend/app/seed/assets/templates_canvas_json/*.json` — one file per template.
  - [ ] For each template, produce a thumbnail via `canvas.toDataURL('image/png')` at 300×300.
- [ ] **T-2 · Seed module**
  - [ ] Create `backend/app/seed/templates_seed.py`.
  - [ ] Load each JSON + thumbnail pair.
  - [ ] Build template documents matching ARD §8.1 schema.
  - [ ] Insert into `templates` collection if empty.
- [ ] **T-3 · Wire into lifespan**
  - [ ] In `backend/app/main.py` `lifespan()`, call `seed_templates()` if env `PIXELS_SEED_TEMPLATES` is set.
- [ ] **T-4 · Extend template_routes**
  - [ ] Add `platform` and `tags` query parameters to `GET /api/v1/templates`.
  - [ ] Preserve existing endpoints behavior.
- [ ] **T-5 · Tests**
  - [ ] `backend/tests/test_templates_seed.py` covering AC-8.
  - [ ] `backend/tests/test_template_routes.py` covering filter endpoints.

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/backend/app/seed/__init__.py` | new |
| `pixelforge/backend/app/seed/templates_seed.py` | new |
| `pixelforge/backend/app/seed/assets/templates_canvas_json/*.json` | new (20 files) |
| `pixelforge/backend/app/seed/assets/templates_thumbnails/*.png` | new (20 files) |
| `pixelforge/backend/app/main.py` | modified (lifespan hook) |
| `pixelforge/backend/app/template_routes.py` | modified (filters) |
| `pixelforge/backend/tests/test_templates_seed.py` | new |
| `pixelforge/backend/tests/test_template_routes.py` | modified |

## Definition of Done

- [ ] All ACs met. 20 templates render in `/gallery/ig-post` etc.
- [ ] pytest green.
- [ ] Sally reviews thumbnails for quality before merge.
- [ ] Docstrings complete.
- [ ] File List matches.
