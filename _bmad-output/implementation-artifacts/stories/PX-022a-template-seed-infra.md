# Story PX-022a — Template seed infrastructure

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 1
**Size:** M
**Priority:** P0
**Owner:** Amelia
**Status:** Ready for dev
**Depends on:** PX-020 (platform-presets source of truth), Winston's ARD §8.1 schema
**Parent story (now split):** `PX-022-seed-starter-templates.md` — parent retained as tracker; code lives in this 22a + sibling 22b.

---

## Context

`PX-022` (seed 20 starter templates) was sized M originally; Amelia's review correctly upped this to L and flagged it should split into infra vs content. This story covers **infrastructure only** — the seed module, lifespan wiring, filter endpoints, and tests. The actual template designs (canvas JSON + thumbnails) are authored in sibling story `PX-022b`.

---

## Acceptance Criteria

- **AC-1** — `backend/app/seed/__init__.py` + `backend/app/seed/templates_seed.py` exist, with `async def seed_templates(db, force: bool = False) -> int`. Returns count inserted.
- **AC-2** — Seeding loads every `*.json` under `backend/app/seed/assets/templates_canvas_json/` paired with a same-stem `*.png` under `backend/app/seed/assets/templates_thumbnails/`.
- **AC-3** — Idempotent: if `templates` collection is non-empty AND `force` is False, insert 0. Logged.
- **AC-4** — Wired into `backend/app/main.py` `lifespan()` — runs only if env `PIXELS_SEED_TEMPLATES=1`.
- **AC-5** — `GET /api/v1/templates?platform=<type>&tags=<csv>` filters correctly. Missing params return all templates.
- **AC-6** — Every inserted document matches ARD §8.1 schema (validates with pydantic `Template` model — new in `schemas/template.py`).
- **AC-7** — `mypy --strict backend/app/seed` clean.
- **AC-8** — pytest covers: empty-collection-seed, idempotent-second-seed, force-re-seed, filter-by-platform, filter-by-tag.
- **AC-9** — Google-style docstrings on every public function per project-context.md §6.B.

## Tasks / Subtasks

- [ ] **T-1 · Schema + pydantic model**
  - [ ] Create `backend/app/schemas/template.py` with `Template(BaseModel)` matching ARD §8.1. Include `palette_slots: list[PaletteSlot]` sub-model.
- [ ] **T-2 · Seed module**
  - [ ] Create `backend/app/seed/__init__.py`.
  - [ ] Create `backend/app/seed/templates_seed.py` with loader + inserter.
  - [ ] Handle missing pairs gracefully (log warning, skip).
- [ ] **T-3 · Asset directories**
  - [ ] Create `backend/app/seed/assets/templates_canvas_json/.gitkeep` and `backend/app/seed/assets/templates_thumbnails/.gitkeep`. Content-filling is PX-022b's job.
- [ ] **T-4 · Lifespan hook**
  - [ ] In `backend/app/main.py`, inside the existing `lifespan()` context manager, call `await seed_templates(db)` when env `PIXELS_SEED_TEMPLATES` is set. Log results.
- [ ] **T-5 · Route filters**
  - [ ] Extend `template_routes.py`: `GET /api/v1/templates` takes optional `platform` and `tags` query params. Use `Annotated[AsyncIOMotorDatabase, Depends(get_db)]` — honor PX-002's pattern.
- [ ] **T-6 · Tests**
  - [ ] `backend/tests/test_templates_seed.py` — infra behaviors (AC-3, force, missing-pair).
  - [ ] `backend/tests/test_template_routes.py` — filter endpoints. Use fixture to insert a few synthetic templates.

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/backend/app/schemas/__init__.py` | new if missing |
| `pixelforge/backend/app/schemas/template.py` | new |
| `pixelforge/backend/app/seed/__init__.py` | new |
| `pixelforge/backend/app/seed/templates_seed.py` | new |
| `pixelforge/backend/app/seed/assets/templates_canvas_json/.gitkeep` | new |
| `pixelforge/backend/app/seed/assets/templates_thumbnails/.gitkeep` | new |
| `pixelforge/backend/app/main.py` | modified (lifespan) |
| `pixelforge/backend/app/template_routes.py` | modified (filters) |
| `pixelforge/backend/tests/test_templates_seed.py` | new |
| `pixelforge/backend/tests/test_template_routes.py` | new or modified |

## Definition of Done

- All ACs met. `pytest backend/` green. `mypy --strict backend/app/seed` clean. Docstrings complete. File List matches diff.
