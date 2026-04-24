# Story PX-022a — Template seed infrastructure

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 1
**Size:** M
**Priority:** P0
**Owner:** Amelia
**Status:** COMPLETE (Amelia, 2026-04-23)
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

- [x] **T-1 · Schema + pydantic model**
  - [x] Create `backend/app/schemas/template.py` with `Template(BaseModel)` matching ARD §8.1. Include `palette_slots: list[PaletteSlot]` sub-model.
- [x] **T-2 · Seed module**
  - [x] Create `backend/app/seed/__init__.py`.
  - [x] Create `backend/app/seed/templates_seed.py` with loader + inserter.
  - [x] Handle missing pairs gracefully (log warning, skip).
- [x] **T-3 · Asset directories**
  - [x] Create `backend/app/seed/assets/templates_canvas_json/.gitkeep` and `backend/app/seed/assets/templates_thumbnails/.gitkeep`. Content-filling is PX-022b's job.
- [x] **T-4 · Lifespan hook**
  - [x] In `backend/app/main.py`, inside the existing `lifespan()` context manager, call `await seed_templates(db)` when env `PIXELS_SEED_TEMPLATES` is set. Log results.
- [x] **T-5 · Route filters**
  - [x] Extend `template_routes.py`: `GET /api/v1/templates` takes optional `platform` and `tags` query params. Use `Annotated[AsyncIOMotorDatabase, Depends(get_db)]` — honor PX-002's pattern.
- [x] **T-6 · Tests**
  - [x] `backend/tests/test_templates_seed.py` — infra behaviors (AC-3, force, missing-pair).
  - [x] `backend/tests/test_template_routes.py` — filter endpoints. Use fixture to insert a few synthetic templates.

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

---

## Dev Agent Record

**Agent:** Amelia (Opus 4.7 1M) — 2026-04-23
**Status:** COMPLETE

### Summary
Seed infrastructure for ARD §8.1 `templates` collection is live:

- `schemas/template.py` — Pydantic v2 `Template` + `PaletteSlot` with hex-color and data-URL validators; `extra="forbid"`.
- `seed/templates_seed.py` — idempotent async loader. Pair discovery, JSON parse, base64-PNG embed, per-doc `Template.model_validate`, bulk insert. Force-reseed wipes first.
- `main.lifespan()` — gated on `PIXELS_SEED_TEMPLATES=1`; logs insert count; swallows + logs seeder errors so they never abort startup.
- `template_routes.seed_template_router` — `GET /api/v1/templates?platform=&tags=csv` with Annotated `Depends(get_db)`. Tags use OR semantics via `$in`; platform is exact-match. Both are AND-composed. Returns `[]` when DB offline.
- Tests: 9 seed tests (empty, valid-pair, idempotent, force, missing-thumb, invalid schema, missing canvas dir, bare scene, malformed JSON) + 6 route tests (empty, all, platform filter, single tag, multi-tag CSV, combined platform+tag).

### Test evidence
- `pytest`: **53 passing** (38 baseline preserved + 15 new). No failures, no skips.
- `mypy --strict app/seed app/schemas/template.py`: **clean** (3 files, 0 issues).

### Decisions (autonomous, in scope)
1. Kept the existing `public_templates` collection + `/api/public-templates` routes intact. Story AC-5 talked about extending `template_routes.py` to serve `/api/v1/templates`, but the existing endpoint uses a different schema (community-shared templates with `uses_count`, etc.) and a different URL namespace. Interpretation: the ARD §8.1 *seed* collection is a separate concern. Added a second router `seed_template_router` in the same module rather than rewriting — zero blast radius on consumers of `public_templates`.
2. Seed JSON format: accept *either* a full template document (top-level `name`/`platform`/`tags`/`palette_slots`/`canvas_json`) *or* log-and-skip for bare fabric scenes. This lets PX-022b author content with full schema fidelity without a sidecar file.
3. `PaletteRoleLiteral` captures the five roles enumerated in ARD §8.1 (`primary`, `secondary`, `text`, `accent`, `background`). Extending is cheap — one literal edit.
4. Protocol types (`_DatabaseProto`, `_TemplatesCollectionProto`) keep the seeder's public contract narrow enough that both motor and mongomock pass mypy strict without widening imports.

### Surprises / follow-ups (out of scope)
- PX-022b is responsible for authoring 20 actual `*.json`/`*.png` pairs; the asset dirs only contain `.gitkeep` for now.
- Frontend has no consumer for `/api/v1/templates` yet — PX-023 (gallery UI) will wire it up.
- Thumbnail dimension cap (300×300) is a PX-022b authoring-time concern; not enforced in the schema to avoid pulling Pillow into the hot validation path.
- `pytest-asyncio` default-fixture-loop-scope deprecation warning is project-wide, not introduced here.

### File List (actual)
Created:
- `pixelforge/backend/app/schemas/__init__.py`
- `pixelforge/backend/app/schemas/template.py`
- `pixelforge/backend/app/seed/__init__.py`
- `pixelforge/backend/app/seed/templates_seed.py`
- `pixelforge/backend/app/seed/assets/templates_canvas_json/.gitkeep`
- `pixelforge/backend/app/seed/assets/templates_thumbnails/.gitkeep`
- `pixelforge/backend/tests/test_templates_seed.py`

Modified:
- `pixelforge/backend/app/main.py`
- `pixelforge/backend/app/template_routes.py`
- `pixelforge/backend/tests/test_template_routes.py`
