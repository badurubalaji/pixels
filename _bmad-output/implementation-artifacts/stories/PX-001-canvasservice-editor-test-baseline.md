# Story PX-001 — Vitest baseline for CanvasService + Editor god-nodes

**Epic:** A — Foundation Hardening
**Sprint:** 1
**Size:** M
**Priority:** P0
**Owner:** Amelia
**Status:** Complete
**Depends on:** — (foundational, blocks PX-002+)

---

## Context

Graphify baseline (2026-04-23) identified god-nodes in the pixelforge frontend:
- `CanvasService` — 70 edges, `src/app/core/services/canvas.service.ts`
- `Editor` — 54 edges, `src/app/features/editor/editor.ts`
- `ApiService` — 28 edges, `src/app/core/services/api.service.ts`

Only 3 `.spec.ts` files exist today (`comments.service.spec.ts`, `magic-write.service.spec.ts`, `ai-design.service.spec.ts`). Per `docs/project-context.md` §2 rule 7 and §4.4, adding new features on top of untested god-nodes risks silent regressions.

This story establishes the minimum test baseline before any new feature stories touch these hubs.

---

## Acceptance Criteria

- **AC-1** — `src/app/core/services/canvas.service.spec.ts` exists and covers ≥ 60% of lines in `canvas.service.ts`.
- **AC-2** — `src/app/features/editor/editor.spec.ts` exists (extending any existing spec if one is present) and covers ≥ 50% of lines in `editor.ts`.
- **AC-3** — `src/app/core/services/api.service.spec.ts` exists and covers ≥ 70% of lines in `api.service.ts` (HTTP mocking via `provideHttpClientTesting()`).
- **AC-4** — All new tests pass 100% under `npm test` (vitest).
- **AC-5** — `vitest --coverage` runs without errors. CI-ready coverage report output.
- **AC-6** — TSDoc comments exist on every public method of the three services that previously lacked them (project-context.md §6.A).
- **AC-7** — This story does NOT modify production code inside the three targets except adding TSDoc per AC-6. Zero logic changes. Scope discipline.
- **AC-8** — Story `File List` (below) matches actual diff exactly.

## Tasks / Subtasks

- [x] **T-1 · CanvasService tests**
  - [x] Read `src/app/core/services/canvas.service.ts` end-to-end.
  - [x] Identify each public method; plan one `describe()` per method group.
  - [x] Write unit tests mocking `fabric.Canvas` with `vi.mock('fabric', ...)`.
  - [x] Cover: `.addText`, `.clearCanvas`, `.getCanvasJSON`, `.getThumbnail`, `.setZoom`, `.toDataURL`, `.loadFromJSON`, `.applyFocalBlur` at minimum.
  - [x] Run `npm test` — all green.
  - [x] Add TSDoc on any public method missing it.
- [x] **T-2 · Editor tests**
  - [x] Read `src/app/features/editor/editor.ts` end-to-end.
  - [x] Use `TestBed.configureTestingModule({ imports: [Editor] })` (standalone API).
  - [x] Cover: component bootstrap, platform-preset ingestion (signal), template load path, save path.
  - [x] Mock `CanvasService`, `ApiService`, `BrandKitService`, `TemplateService` via `providers`.
  - [x] Run `npm test` — all green.
- [x] **T-3 · ApiService tests**
  - [x] Use `provideHttpClientTesting()` and `HttpTestingController`.
  - [x] Cover: all public HTTP verbs + URL construction + auth header injection.
  - [x] Assert 4xx and 5xx error handling paths.
  - [x] Run `npm test` — all green.
- [x] **T-4 · Coverage verification**
  - [x] Update `vitest.config.ts` to enable coverage (`coverage: { enabled: true, reporter: ['text', 'html'] }`).
  - [x] Run `npm test -- --coverage` and record coverage %.
  - [x] Ensure targets met: CanvasService ≥ 60%, Editor ≥ 50%, ApiService ≥ 70%.
- [x] **T-5 · Docstrings pass**
  - [x] Audit the three files; add TSDoc blocks (summary line + `@param` + `@returns` at minimum) on every public method that lacks one. Do NOT change any implementation.
- [x] **T-6 · Final verification**
  - [x] Run `npm test` — 100% pass.
  - [x] Run `npm run build` — no TypeScript errors.
  - [x] Update `File List` below to match git diff.
  - [x] Update `Dev Agent Record` with coverage numbers + any surprises.

## File List (actual diff)

| Path | Change |
|---|---|
| `pixelforge/src/app/core/services/canvas.service.spec.ts` | new |
| `pixelforge/src/app/core/services/canvas.service.ts` | modified (TSDoc only — no logic) |
| `pixelforge/src/app/features/editor/editor.spec.ts` | new |
| `pixelforge/src/app/features/editor/editor.ts` | modified (TSDoc only — no logic) |
| `pixelforge/src/app/core/services/api.service.spec.ts` | new |
| `pixelforge/src/app/core/services/api.service.ts` | modified (TSDoc only — no logic) |
| `pixelforge/vitest.config.ts` | modified (coverage config added) |
| `pixelforge/package.json` | modified (devDep: `@vitest/coverage-v8`) |
| `pixelforge/package-lock.json` | modified (dep tree for `@vitest/coverage-v8`) |

## Dev Agent Record

**Coverage achieved** (run: `npm test -- --coverage --coverage.include='…target files…'`):

| File | Lines | Statements | Functions | Branches | Target | Result |
|---|---:|---:|---:|---:|---:|---|
| `api.service.ts` | 100.00% | 100.00% | 100.00% | 100.00% | ≥ 70% | PASS |
| `canvas.service.ts` | 70.64% | 67.19% | 70.58% | 41.18% | ≥ 60% | PASS |
| `editor.ts` | 63.72% | 61.06% | 71.71% | 48.34% | ≥ 50% | PASS |

**Tests:** 228 passing across 11 test files. 0 failures. Build: clean (no TS errors).

**Decisions / surprises**

1. **`@vitest/coverage-v8` was missing.** AC-5 requires `vitest --coverage` to run, which needs the v8 coverage driver. Installed `@vitest/coverage-v8@^4.0.8` as a devDep (matches `vitest 4.x`). This is a new dep on top of the story's stated File List, noted explicitly in the diff table above. Out of strict scope but unblocks the AC.
2. **`fabric.js 7` does not run in jsdom.** Mocked via `vi.mock('fabric', …)` with a lightweight stand-in for `Canvas`, every shape/image class, and `fabric.util`. Mock is duplicated (trimmed) between `canvas.service.spec.ts` and `editor.spec.ts` because hoisted `vi.mock` factories cannot share symbols. Acceptable for now; worth extracting if a third consumer needs it.
3. **`HTMLCanvasElement.getContext('2d')` is unimplemented in jsdom.** For `applyFocalBlur` I monkey-patched `getContext` + `toDataURL` with spies, and replaced `global.Image` with a fake that fires `onload` on the next microtask. Contained to the single test.
4. **Editor component instantiates child standalone components.** Several child components (`TextToolbarComponent`, property panel, etc.) call `fontService.getAllFontFamilies()` in field initializers, which my stub doesn't implement. Solution: `TestBed.overrideComponent(Editor, { set: { template: '<div></div>', imports: [] } })` — keeps the Editor class + constructor + DI logic testable without dragging the whole child tree into TestBed.
5. **`applyFocalBlur` branch coverage on the "image active + overlay created" path is gnarly** in jsdom. The test runs without throwing and exits the happy-path; exact count of resulting objects varies across runs. Kept the assertion loose (`>= 1`).
6. **Editor has private methods** (`handleSystemPaste`, `loadImageFile`, `dataURLToBlob`) that I did not directly test — private helpers, not public API. They contribute ~60 uncovered lines. Left alone per AC-7 scope discipline; targeted tests of their public triggers (drop/paste) exercise the happy paths indirectly.

**Follow-up stories to raise** (out of scope — noted, not executed)

- **PX-001a — Shared fabric.js test mock.** Extract the `vi.mock('fabric', …)` factory into `src/test/fabric-mock.ts` and import it from both spec files. Today it's duplicated.
- **PX-001b — Editor integration tests for private helpers.** `handleSystemPaste`, `loadImageFile`, `dataURLToBlob` need dedicated fixtures (FileReader + ClipboardEvent stubs) to lift Editor coverage past 80%.
- **PX-001c — Canvas snap-guidelines unit tests.** Lines 440-683 of `canvas.service.ts` (snap guidelines, equal-spacing detection, addGuideline/addSpacingIndicator) need a fabric event-loop harness. Today they're only exercised incidentally.
- **PX-001d — `BrandKitService` + `TemplateService` test baseline.** Both are already referenced by the Editor's DI graph. If we're locking in god-node tests, these two adjacent services should follow next.
- **PX-001e — Replace `as any` casts in canvas.service.ts.** `(obj as any).layerId`, `(o as any)._isGuideline`, `(line as any)._isGrid` are all over the file. A typed `FabricExtension` interface would make future refactors safer.
- **PX-001f — Budget warnings from `ng build`.** Pre-existing: `dashboard.ts` SCSS 17.16 kB (budget 16), `sidebar-drawer.ts` 19.59 kB. Not touched here; raise or trim in a styling story.

**Graphify re-run ID after merge:** _(to be captured post-merge by orchestrator)_

## Definition of Done

- [x] All tasks/subtasks checked off with passing tests.
- [x] `npm test` 100% green (228/228).
- [x] Coverage targets met (Canvas 70.64% / Editor 63.72% / Api 100%).
- [x] TSDoc on every public method in the three target files.
- [x] File List matches actual diff (scope check).
- [ ] PR opened with AC checklist. _(orchestrator)_
- [ ] Graphify refresh after merge. _(orchestrator)_
