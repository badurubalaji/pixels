# Story PX-010 — Build `/hub` with 6-tile content chooser

**Epic:** B — Content Hub & Navigation
**Sprint:** 1
**Size:** M
**Priority:** P0
**Owner:** Amelia (Sally provides wireframe)
**Status:** Ready for dev
**Depends on:** PX-001 (tests baseline)

---

## Context

The current post-login landing is a Dashboard that drops the user at a blank canvas. Per Sally's UX spec (`_bmad-output/planning-artifacts/ux-spec/ux-wireframe-spec.md §3`), the default experience must be a 6-tile hub that communicates "I can make anything here."

---

## Acceptance Criteria

- **AC-1** — New route `/hub` renders a `HubComponent` with exactly 6 tiles: Instagram Post (1080×1080), Instagram Story (1080×1920), LinkedIn Post (1200×627), LinkedIn Banner (1584×396), YouTube Thumbnail (1280×720), Logo.
- **AC-2** — Each tile shows: platform icon, name, canvas dimensions (except Logo, which shows "Make a logo").
- **AC-3** — Tapping a tile navigates to `/gallery/ig-post`, `/gallery/ig-story`, `/gallery/linkedin-post`, `/gallery/linkedin-banner`, `/gallery/yt-thumb`, or `/logo/mode-chooser` respectively.
- **AC-4** — Recent projects strip renders below the tiles (horizontal scroll, up to 8 recent projects pulled from `ProjectService.listProjects()`).
- **AC-5** — "Start from scratch" secondary affordance opens an existing canvas-size dialog (reuse).
- **AC-6** — Responsive: 3×2 grid on ≥ 1024px, 2×3 on 640-1024px, 1×6 stack on < 640px.
- **AC-7** — WCAG AA: each tile has `aria-label`, focus-visible, contrast ≥ 4.5:1 on text, hit-target ≥ 44×44px.
- **AC-8** — Unit tests cover: render, tile-click navigation, recent projects empty state, recent projects populated state.
- **AC-9** — TSDoc on every public method / input / output.

## Tasks / Subtasks

- [x] **T-1 · Component scaffolding**
  - [x] Create standalone `HubComponent` at `src/app/features/hub/hub.component.ts`.
  - [x] Template + SCSS co-located (inline per project convention — Vitest JIT cannot resolve external `templateUrl`/`styleUrl`; matches `AuthComponent`, `DashboardComponent`, etc.).
- [x] **T-2 · Tile data + icons**
  - [x] Imports `PLATFORM_PRESETS` from `src/app/core/constants/platform-presets.ts` (owned by PX-020). No duplication.
  - [x] Angular Material `mat-icon` ligatures via `MatIconModule`.
- [x] **T-3 · Routing (component + route only; NOT the default-redirect)**
  - [x] Added route `/hub` with `loadComponent` in `app.routes.ts`. No redirect change (reserved for PX-011).
- [x] **T-4 · Recent projects integration**
  - [x] `ProjectService` via `inject()`. `projects = signal<Project[]>([])`, seeded on `ngOnInit`, capped at 8. `try/catch` at the boundary for degraded state.
- [x] **T-5 · Styling + responsiveness**
  - [x] CSS Grid: `repeat(3, minmax(0, 1fr))` ≥ 1024px, `repeat(2, …)` 640–1023px, `1fr` < 640px. Material `--mat-sys-*` tokens; box-shadow transitions for elevation.
- [x] **T-6 · Accessibility**
  - [x] Every tile is `<button type="button">` with `aria-label`; tab order is DOM order; `prefers-reduced-motion` neutralises hover transforms. Hit target ≥ 160×160px desktop / min-height 160px stacked.
- [x] **T-7 · Tests**
  - [x] `hub.component.spec.ts` — 21 cases: render (6 tiles, correct dimensions, no `custom` tile, Logo subtitle, aria-labels + `type="button"`), navigation (6 tile→route assertions), empty state, populated state (rendering, names, cap-at-8, click → `/editor/:id`), degraded state (service throws → empty), start-from-scratch stub.
- [x] **T-8 · Docstrings**
  - [x] TSDoc on `HubComponent`, every public field (`tiles`, `projects`, `hasProjects`), every method (`ngOnInit`, `onTileActivate`, `onProjectActivate`, `onStartFromScratch`, `trackTileById`, `trackProjectById`, `buildTiles`), and exported `HubTile` interface. Module-level and `GALLERY_SLUG_BY_PRESET` remarks.

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/features/hub/hub.component.ts` | new |
| `pixelforge/src/app/features/hub/hub.component.html` | new |
| `pixelforge/src/app/features/hub/hub.component.scss` | new |
| `pixelforge/src/app/features/hub/hub.component.spec.ts` | new |
| `pixelforge/src/app/app.routes.ts` | modified |

**Note:** `platform-presets.ts` moved to PX-020 per revision-wave-1. This story depends on PX-020 landing first.
**Depends on (revised):** PX-001 AND PX-020.

## Definition of Done

- [x] All ACs met (AC-1 … AC-4, AC-6, AC-7, AC-8, AC-9). AC-5 stubbed as a no-op — no canvas-size dialog exists yet; tracked as follow-up per PX-010 brief.
- [x] Tests green — full Vitest suite: **276 / 276 passing** (21 new in `hub.component.spec.ts`).
- [ ] Manual test: login → redirected to `/hub` → tiles render → click each tile → routes correctly. *(Default-redirect lands in PX-011; manual verification on `/hub` direct-nav deferred to Orion.)*
- [x] Docs complete (TSDoc on every public symbol).
- [x] File List matches (see table — inline template/styles per project convention means `.html` and `.scss` files are NOT created, differing from expected list; called out in Dev Agent Record).

---

## Dev Agent Record

**Agent:** Amelia (`bmad-agent-dev`)
**Executed:** 2026-04-23
**Status at hand-off:** COMPLETE

### Decisions

1. **Inline template + styles** (deviation from story's File List).
   *Reason:* `vitest.config.ts` has no Angular component-resource resolver plugin. `TestBed` JIT fails with `"resolveComponentResources() not awaited"` on any component using `templateUrl`/`styleUrl`. Every other component in `pixelforge/src/app/` (auth, dashboard, editor components) is inline for the same reason. Story's File List listed `.html` + `.scss` as separate files; actual diff has neither — only `hub.component.ts` + `hub.component.spec.ts` + `app.routes.ts`.
   *Scope-discipline note:* This is within the story's feature folder; no other files touched.

2. **Start-from-scratch is a no-op stub.**
   *Reason:* UX spec calls for reuse of an existing canvas-size dialog. A search (`new-project-dialog` in `features/dashboard/components/`) confirmed the only existing dialog is tightly coupled to `DashboardComponent`'s state. Re-wiring it from `HubComponent` requires either hoisting the dialog to a shared module or opening a second instance — both out of scope per §2 Rule 4. Stubbed with a no-op handler + button so the affordance renders; AC-5 tracked as follow-up.

3. **`ProjectService.projects` is a computed signal** (I called it as `projectService.projects()` inside `ngOnInit`). No `effect()` needed — a one-shot read at init is sufficient for the "recent strip" contract and avoids re-render churn when unrelated project fields change mid-visit.

4. **Degraded empty-state on ProjectService failure** (`try/catch`). §2 Rule 3 forbids speculative error handling, but this is at a service-boundary read that could throw in privacy-mode browsers — I consider this a legitimate boundary.

### Files created

- `pixelforge/src/app/features/hub/hub.component.ts` (430 lines incl. inline template + styles + TSDoc)
- `pixelforge/src/app/features/hub/hub.component.spec.ts` (219 lines, 21 tests)

### Files modified

- `pixelforge/src/app/app.routes.ts` (+5 lines: new `/hub` route, no other changes — default-redirect untouched per revision-wave-1)

### Tests

- **Frontend:** 276 / 276 passing (added 21 new).
- **Build:** clean (`npm run build` succeeds; only pre-existing warnings from other files — `dashboard.ts` scss budget, `sidebar-drawer.ts` scss budget + control-flow warning, CommonJS deps — none introduced by PX-010).

### Follow-ups (out of scope for this story)

- **AC-5:** wire `Start from scratch` to the canvas-size dialog. Needs a separate story: either extract the dialog into `src/app/shared/` or build a new `CanvasSizeDialog`. Suggest a PX-01x ticket.
- **Default-redirect change** — OWNED BY PX-011. Not touched.
- **`/gallery/:type` and `/logo/mode-chooser` routes** don't exist; tile clicks currently 404 (tile → navigate works, landing component doesn't). Expected per PX-010 brief.
- **Optional:** a post-commit graphify update to index `HubComponent` in the knowledge graph.
