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

- [ ] **T-1 · Component scaffolding**
  - [ ] Create standalone `HubComponent` at `src/app/features/hub/hub.component.ts`.
  - [ ] Template + SCSS co-located if < 150 lines.
- [ ] **T-2 · Tile data + icons**
  - [ ] **Do NOT create `src/app/core/constants/platform-presets.ts` here** — that file is owned by PX-020 (per revision-wave-1). If PX-010 needs to execute before PX-020, this story is blocked until PX-020's constants file lands.
  - [ ] Import `PLATFORM_PRESETS` from `src/app/core/constants/platform-presets.ts` (created by PX-020).
  - [ ] Use Angular Material icons or existing stock icons.
- [ ] **T-3 · Routing (component + route only; NOT the default-redirect)**
  - [ ] Add route `/hub` to `app.routes.ts`. `loadComponent: () => import(...).then(m => m.HubComponent)`.
  - [ ] **Do NOT change the post-login default redirect in this story** — that work belongs to PX-011 (per revision-wave-1, review by Amelia). Keep PX-010's diff scoped to rendering `/hub`, its template, its spec, and the platform-presets constants file.
- [ ] **T-4 · Recent projects integration**
  - [ ] Inject `ProjectService` via `inject()`.
  - [ ] Signal-backed list: `projects = signal<Project[]>([])`.
  - [ ] Load on ngOnInit via `effect()` or direct call.
- [ ] **T-5 · Styling + responsiveness**
  - [ ] CSS Grid with `auto-fit` / `minmax()`.
  - [ ] Use Material elevation tokens.
- [ ] **T-6 · Accessibility**
  - [ ] Every tile is a `<button type="button">` with `aria-label`.
  - [ ] Tab order follows visual order.
  - [ ] `prefers-reduced-motion` respected on hover transitions.
- [ ] **T-7 · Tests**
  - [ ] `hub.component.spec.ts` — TestBed standalone imports, ProjectService mock, route navigation assertions via `NavigationMock` / harness.
- [ ] **T-8 · Docstrings**
  - [ ] TSDoc on component, every input/output, every public method.

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

- [ ] All ACs met.
- [ ] Tests green (vitest).
- [ ] Manual test: login → redirected to `/hub` → tiles render → click each tile → routes correctly.
- [ ] Docs complete.
- [ ] File List matches.
