# Story PX-060 — Brand-Kit auto-apply on template load + undo toast

**Epic:** G — Brand Kit Integration
**Sprint:** 2
**Size:** M
**Priority:** P0
**Owner:** Amelia
**Status:** Ready for dev
**Depends on:** PX-023 (gallery → editor flow carries Brand-Kit-applied canvas)

**Scope note (revision 2026-04-24):** PX-023 correctly deferred the `projects` schema extension (`source_template_id`, `brand_kit_applied_at`, `platform`) to maintain in-layer scope discipline. PX-060 now includes **T-0: Backend schema extension** as a precondition — ~20 LOC covering pydantic models, route body fields, and round-trip tests. This is explicitly authorized cross-layer work; the feature's correctness demands it and the diff is small + bounded.

---

## Context

The moat of the product is "templates that already look like MY brand." PX-023 does the Brand-Kit pre-composition at gallery thumbnail time; this story makes it *visible* in the editor itself:

1. When a user opens a project that was created from a template, the editor shows a non-blocking toast: "Applied your Brand Kit colors to this template. Undo?"
2. If the user clicks Undo, the canvas reverts to the template's default palette.
3. If ignored, the toast auto-dismisses in 7 seconds.

Per PRD §4 JTBD-4 and UX spec §5 "Additions" — the Brand-Kit auto-apply toast.

---

## Acceptance Criteria

- **AC-1** — When the Editor loads a project whose `source_template_id` is set AND the user has a non-empty Brand Kit, a toast appears: *"Applied your Brand Kit colors to this template. Undo?"*
- **AC-2** — The toast has a visible "Undo" button. Clicking it reverts every auto-applied palette-slot color back to the template's default palette (requires storing the "before" palette on the project or re-fetching from the source template).
- **AC-3** — Toast auto-dismisses after 7 seconds if ignored. Dismissal doesn't break Undo later via the editor's existing undo stack.
- **AC-4** — The toast is shown at most **once per project-open** — reopening the same project later does not re-show it.
- **AC-5** — If Brand Kit was empty or `source_template_id` is null (user started from scratch), no toast appears.
- **AC-6** — The auto-applied state is persisted on the project (`brand_kit_applied_at` timestamp) so the toast logic can tell "just now" from "a previous session."
- **AC-7** — Undo action integrates with the existing `HistoryService` — clicking Undo pushes an undoable operation so the user can re-do it.
- **AC-8** — WCAG: toast is a Material `MatSnackBar` or equivalent, `aria-live="polite"`, keyboard-dismissible.
- **AC-9** — Scope discipline: no changes to the template shape, no changes to Brand Kit storage; only the editor-load hook + toast + undo wiring.
- **AC-10** — Unit tests cover: toast shows with valid template + Brand Kit; no toast with empty Brand Kit; no toast with null `source_template_id`; undo reverts palette; auto-dismiss at 7s; once-per-project guarantee.
- **AC-11** — TSDoc on every new public symbol.

## Tasks / Subtasks

- [ ] **T-0 · Backend schema extension (precondition, folded in from PX-023 scope deferral)**
  - [ ] Extend `backend/app/models.py` `ProjectCreate`, `ProjectUpdate`, and `Project` (the DB-read model) with 3 optional fields:
    - `source_template_id: str | None = None`
    - `brand_kit_applied_at: datetime | None = None`
    - `platform: str | None = None`  (one of the `PlatformType` ids OR None for legacy rows)
  - [ ] `backend/app/project_routes.py` — ensure `create_project`, `get_project`, `list_projects`, `update_project` round-trip the 3 new fields (read-write Mongo passthrough).
  - [ ] Data migration: on `main.py` lifespan startup (gated `PIXELS_RUN_MIGRATIONS=1`), scan existing `projects` documents missing `platform`; infer from `canvas_json.width/height` using PX-020's platform presets → set accordingly OR `"custom"`. Idempotent.
  - [ ] Backend tests: extend `test_project_routes.py` with round-trip assertions for the 3 new fields + the migration test.
  - [ ] Frontend: extend `ApiService.Project` interface + `ApiService.createProjectFromTemplate` to actually send `source_template_id` + `platform` (drop the wire-level drop from PX-023). Extend `api.service.spec.ts`.
  - [ ] Preserve 61/61 BE + 334/334 FE tests.
- [ ] **T-1 · Editor load hook**
  - [ ] In `Editor` component `ngAfterViewInit` (or wherever a project is loaded after PX-020's preset step), after canvas-load, inspect the project's `source_template_id` + `brand_kit_applied_at` fields.
  - [ ] If `source_template_id` is set, Brand Kit is non-empty, and `brand_kit_applied_at` is within the last 5 minutes (heuristic for "this load"), invoke the toast.
- [ ] **T-2 · Toast via MatSnackBar**
  - [ ] Use existing Material SnackBar (already in use elsewhere? verify; add `MatSnackBarModule` import if not).
  - [ ] 7-second duration, action label "Undo."
  - [ ] `aria-live="polite"` semantics.
- [ ] **T-3 · Undo path**
  - [ ] On Undo-click, fetch the template's original `canvas_json` via `TemplateService.getById(source_template_id)`. Diff the current canvas's palette-slot colors vs template defaults. Revert each.
  - [ ] Push an undoable operation onto `HistoryService` so redo works.
  - [ ] Clear `brand_kit_applied_at` on the project (sets the "reverted" state server-side).
- [ ] **T-4 · Once-per-project guarantee**
  - [ ] Use the `brand_kit_applied_at` field: if it's set AND within N seconds of "now," show toast. On toast auto-dismiss OR undo-click, we don't show it again in this session (per-project in-memory flag).
- [ ] **T-5 · Tests**
  - [ ] Editor spec extension: mock Brand Kit, mock project with `source_template_id`, assert SnackBar opened. Reverse for empty Brand Kit.
  - [ ] Undo-action spec: click Undo → canvas palette reverts.
- [ ] **T-6 · TSDoc.**

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/features/editor/editor.ts` | modified (load-hook + toast) |
| `pixelforge/src/app/features/editor/editor.spec.ts` | modified |
| `pixelforge/src/app/core/services/brand-kit-apply.service.ts` | new (revert logic) |
| `pixelforge/src/app/core/services/brand-kit-apply.service.spec.ts` | new |
| `pixelforge/src/app/core/services/template.service.ts` | modified (add `getById` if missing) |
| `pixelforge/backend/app/models.py` | modified (T-0 — add 3 optional fields to ProjectCreate / ProjectUpdate / Project) |
| `pixelforge/backend/app/project_routes.py` | modified (T-0 — round-trip new fields) |
| `pixelforge/backend/app/main.py` | modified (T-0 — migration hook on lifespan) |
| `pixelforge/backend/app/migrations/__init__.py` | new (T-0 — migration module) |
| `pixelforge/backend/app/migrations/0001_projects_platform_backfill.py` | new (T-0) |
| `pixelforge/backend/tests/test_project_routes.py` | modified (T-0 — round-trip + migration tests) |
| `pixelforge/src/app/core/services/api.service.ts` | modified (T-0 — `Project` interface + `createProjectFromTemplate` wire shape) |
| `pixelforge/src/app/core/services/api.service.spec.ts` | modified (T-0) |

## Definition of Done

All ACs met. Tests green. Docs complete. Manual smoke: open a template-backed project with Brand Kit set → toast appears → Undo reverts → canvas palette matches the template default.
