# Story PX-002 — Refactor `get_db()` to FastAPI `Depends(get_db)` across route files

**Epic:** A — Foundation Hardening
**Sprint:** 1
**Size:** S
**Priority:** P0
**Owner:** Amelia
**Status:** Ready for dev
**Depends on:** PX-001 (test baseline — if any handler has tests before refactor, they must still pass)

---

## Context

Graphify (2026-04-23) surfaced an architectural inconsistency: several backend route handlers call `get_db()` via an inferred path rather than FastAPI's idiomatic `Depends(get_db)` dependency-injection pattern.

Specifically flagged as "Surprising Connections":
- `project_routes.py` → `delete_project()` calls `get_db()` inferred-path
- `project_routes.py` → `revoke_share_link()` calls `get_db()` inferred-path
- `brand_routes.py` → `update_brand_kit()` calls `get_db()` inferred-path
- `template_routes.py` → `delete_public_template()` calls `get_db()` inferred-path

Per `docs/project-context.md` §5.1:
> "Dependency injection via FastAPI `Depends(...)`. No globals for DB / config / auth state."
> "Use `Annotated[...]` dependency style: `db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]`."

Likely cause: copy-paste or refactor drift. Fix is mechanical but must be verified with tests.

---

## Acceptance Criteria

- **AC-1** — Every route handler in `pixelforge/backend/app/*_routes.py` receives `db` via `Annotated[AsyncIOMotorDatabase, Depends(get_db)]`. No bare `get_db()` call inside a handler body.
- **AC-2** — `pixelforge/backend/app/database.py` still exposes `get_db()` as the DI provider — do NOT remove or rename.
- **AC-3** — All existing endpoints return the same response shape and status codes they did before this refactor (no behavioral change).
- **AC-4** — pytest tests for each refactored route file pass 100%. If no tests existed for a route, add a minimal happy-path test in the same story (bare-minimum: one 200 response via `httpx.AsyncClient`).
- **AC-5** — Google-style docstrings on every refactored handler per project-context.md §6.B.
- **AC-6** — Scope discipline: no other logic changes. Diff limited to function signatures, handler bodies' db-acquisition line, and added tests.

## Tasks / Subtasks

- [ ] **T-1 · Scope audit**
  - [ ] `grep -n "get_db()" backend/app/*.py` — list every occurrence inside handler bodies.
  - [ ] Confirm count matches graphify surprises (4 files, 4+ handlers). Update T-2 task list accordingly.
- [ ] **T-2 · Backend test infrastructure (precondition)**
  - [ ] Create `backend/tests/` directory.
  - [ ] Add `backend/pytest.ini` with `asyncio_mode = auto`.
  - [ ] Add `backend/tests/conftest.py` with `httpx.AsyncClient` fixture using `LifespanManager` against a test MongoDB (env-controlled).
  - [ ] Add `backend/tests/__init__.py`.
  - [ ] Add a smoke test that hits `/health` to prove the harness works.
- [ ] **T-3 · Refactor `project_routes.py`**
  - [ ] For each handler using `get_db()` directly, add `db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]` to the signature and replace the body call.
  - [ ] Add/update Google docstring on each handler.
  - [ ] Write one happy-path test per refactored handler.
- [ ] **T-4 · Refactor `brand_routes.py`**
  - [ ] Same pattern as T-3.
- [ ] **T-5 · Refactor `template_routes.py`**
  - [ ] Same pattern as T-3.
- [ ] **T-6 · Sweep other `*_routes.py`**
  - [ ] `asset_routes.py`, `auth_routes.py`, `comments_routes.py`, `collab_routes.py` — inspect and fix any similar violations even if graphify didn't flag them. (Precedent: don't leave inconsistency behind; but only in the routes files, not shared services.)
- [ ] **T-7 · Verification**
  - [ ] `pytest backend/` — all green.
  - [ ] Manually run the FastAPI app (`python run.py`) and hit the refactored endpoints via curl/HTTPie.
  - [ ] Confirm response shapes unchanged.

## File List (expected diff)

| Path | Change |
|---|---|
| `pixelforge/backend/app/project_routes.py` | modified (signatures + docstrings) |
| `pixelforge/backend/app/brand_routes.py` | modified |
| `pixelforge/backend/app/template_routes.py` | modified |
| `pixelforge/backend/app/asset_routes.py` | modified (if violations found) |
| `pixelforge/backend/app/auth_routes.py` | modified (if violations found) |
| `pixelforge/backend/app/comments_routes.py` | modified (if violations found) |
| `pixelforge/backend/app/collab_routes.py` | modified (if violations found) |
| `pixelforge/backend/tests/__init__.py` | new |
| `pixelforge/backend/tests/conftest.py` | new |
| `pixelforge/backend/tests/test_health.py` | new |
| `pixelforge/backend/tests/test_project_routes.py` | new |
| `pixelforge/backend/tests/test_brand_routes.py` | new |
| `pixelforge/backend/tests/test_template_routes.py` | new |
| `pixelforge/backend/pytest.ini` | new |
| `pixelforge/backend/requirements.txt` | modified (add pytest, pytest-asyncio, httpx, asgi-lifespan) |

## Dev Agent Record
_(Amelia fills.)_

## Definition of Done

- [ ] AC-1 through AC-6 satisfied.
- [ ] `pytest backend/` green.
- [ ] `ruff backend/` clean.
- [ ] `mypy backend/` clean.
- [ ] Docstrings on every refactored handler.
- [ ] File List matches diff.
- [ ] Graphify refresh post-merge shows the 4 "Surprising Connections" gone.
