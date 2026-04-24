# Story PX-023 — Template gallery with Brand-Kit pre-rendered thumbnails

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 2
**Size:** L
**Priority:** P0
**Owner:** Amelia (+ Sally for layout approval)
**Status:** Ready for dev
**Depends on:** PX-022a (template infrastructure), PX-022b (starter template content)

---

## Context

PX-010 shipped `/hub` with tiles that route to `/gallery/:type` — today those routes 404. PX-023 ships the actual gallery: a route-per-content-type that fetches templates matching that platform, shows them as thumbnails pre-colored with the user's Brand Kit palette, and lets the user click one to create a project and open the editor.

Per UX spec §4 (`_bmad-output/planning-artifacts/ux-spec/ux-wireframe-spec.md`):
- 20 templates per category minimum.
- Thumbnails pre-composed with Brand Kit colors.
- Filter chips (Bold / Minimal / Festive / Corporate).
- Click → create project from template + navigate to `/editor/:projectId`.

---

## Acceptance Criteria

- **AC-1** — Route `/gallery/:type` renders `GalleryComponent`. Valid types: `ig-post`, `ig-story`, `linkedin-post`, `linkedin-banner`, `yt-thumb` (logo has its own flow — see PX-030, not this story).
- **AC-2** — Gallery fetches templates via `GET /api/v1/templates?platform=<type>` (endpoint shipped in PX-022a).
- **AC-3** — Each template renders as a thumbnail tile. The thumbnail is **pre-composed with the user's Brand Kit colors** — every `palette_slots` entry on the template gets mapped to the matching Brand Kit color (`primary`, `secondary`, `text`, `accent`, `background`). If the user's Brand Kit is empty or missing a slot, the template's default color is used.
- **AC-4** — Clicking a thumbnail creates a new project from that template (new row in `projects` collection with `source_template_id` set, `canvas_json` = template's canvas_json with Brand-Kit palette applied, `platform` = the gallery's type, thumbnail data URL copied) and navigates to `/editor/:projectId`.
- **AC-5** — Gallery has filter chips: All / Bold / Minimal / Festive / Corporate / Playful. Chip click re-queries with `?tags=<csv>`.
- **AC-6** — Empty-state UI when API returns 0 templates or API fails — clear message + "Start from scratch" affordance that creates a blank project at the platform's canvas size.
- **AC-7** — "Start from scratch" button (always visible) creates a blank project at the platform's canvas size and navigates to `/editor/:projectId`.
- **AC-8** — Back button returns the user to `/hub`.
- **AC-9** — Loading state (skeletons or spinner) while templates fetch.
- **AC-10** — WCAG AA: every tile is a `<button>` with `aria-label` naming the template, keyboard-navigable, focus-visible, contrast ≥ 4.5:1.
- **AC-11** — Unit tests cover: render with templates, render empty, render loading, filter-chip interaction, thumbnail click creates project + navigates, Brand-Kit color mapping, "Start from scratch" path.
- **AC-12** — TSDoc on every new public symbol.

## Tasks / Subtasks

- [x] **T-1 · Scaffold `GalleryComponent`**
  - [x] Create `src/app/features/hub/gallery.component.ts` (standalone, signals-first, inline template + styles per project convention).
  - [x] Hook into `ActivatedRoute.paramMap` to read `:type` param. Validate against `PlatformType` (reuse `getPlatformPreset` from PX-020); redirect to `/hub` on invalid type.
- [x] **T-2 · Template fetch**
  - [x] Extend `ApiService` with `listTemplates(platform: PlatformType, tags?: string[]): Observable<Template[]>`. URL: `/api/v1/templates?platform=<type>&tags=<csv>`.
  - [x] `Template` TS interface matching ARD §8.1 schema in `core/models/template.model.ts`.
- [x] **T-3 · Brand-Kit thumbnail pre-composition**
  - [x] New `TemplateThumbnailService` with `applyBrandKit`, `renderThumbnailDataUrl`, `getOrRenderThumbnail` + cache.
  - [x] Empty Brand Kit → pass-through + verbatim server thumbnail.
  - [x] Client-side render via fabric.StaticCanvas → `toDataURL('png')` capped 300×300.
- [x] **T-4 · Tile grid + filter chips**
  - [x] `auto-fit, minmax(220px, 1fr)` CSS grid.
  - [x] `MatChipListbox` multi-select, 200ms debounce on re-fetch.
- [x] **T-5 · Click-to-create flow**
  - [x] `ApiService.createProjectFromTemplate` → existing `POST /api/projects` (see Surprises §1).
  - [x] Navigate to `/editor/:projectId?platform=<type>`.
- [x] **T-6 · Start-from-scratch**
  - [x] `onStartFromScratch` → `createProject({name, width, height})`; `emptyCanvasFor(preset)` helper exposed.
- [x] **T-7 · Route wiring**
  - [x] `/gallery/:type` added to `app.routes.ts` with `loadComponent` + `authGuard`.
- [x] **T-8 · Loading + empty states** — `MatProgressBar` indeterminate + empty-state panel with CTA.
- [x] **T-9 · Accessibility pass** — `<button>` semantics, `aria-label` per tile, focus-visible outlines, reduced-motion media query, 4.5:1 contrast via Material tokens.
- [x] **T-10 · Tests + docstrings** — 66 new tests (13 thumbnail + 6 api + 11 gallery + existing 36); TSDoc on every new public symbol.

## Dev Agent Record

**Agent:** Amelia (Opus 4.7, 1M context)
**Completed:** 2026-04-23
**Tests:** 334 passing (was 304; +30 net — 13 thumbnail service + 6 new api.service + 11 gallery).
**Build:** Clean — `tsc --noEmit` exit 0, `ng build --configuration=production` succeeded (pre-existing CJS warnings only).

### Files created
- `pixelforge/src/app/features/hub/gallery.component.ts`
- `pixelforge/src/app/features/hub/gallery.component.spec.ts`
- `pixelforge/src/app/core/services/template-thumbnail.service.ts`
- `pixelforge/src/app/core/services/template-thumbnail.service.spec.ts`
- `pixelforge/src/app/core/models/template.model.ts`

### Files modified
- `pixelforge/src/app/core/services/api.service.ts` — `+listTemplates`, `+createProjectFromTemplate`, types.
- `pixelforge/src/app/core/services/api.service.spec.ts` — 6 new tests.
- `pixelforge/src/app/app.routes.ts` — `/gallery/:type` route.

### Surprises / follow-ups (out of PX-023 scope)

1. **`source_template_id` isn't persisted by today's backend.** The existing `ProjectCreate` schema (`backend/app/models.py`) accepts only `{name, width, height, canvas_json, thumbnail}`. Story T-5 asked to POST `{source_template_id, canvas_json, platform, thumbnail_data_url}`. Per §2 Rule 2 we do not modify the backend in this story — `createProjectFromTemplate` maps our inputs to the existing body (template id is dropped at the wire, surfaced only on the frontend for traceability). If template attribution becomes a real product requirement, a one-line backend story can extend `ProjectCreate`.
2. **Blank-canvas `canvas_json` is not round-tripped.** For the same reason, `onStartFromScratch` calls the existing `createProject({name, width, height})` without a canvas body — the editor hydrates its own blank scene on first load. `emptyCanvasFor(preset)` is exported from `gallery.component.ts` for future use.
3. **Show more / pagination** — UX wireframe shows a "Show more" affordance; PX-023 AC does not mandate pagination and the seed set is 20. Left as a natural extension.

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/features/hub/gallery.component.ts` | new |
| `pixelforge/src/app/features/hub/gallery.component.spec.ts` | new |
| `pixelforge/src/app/core/services/template-thumbnail.service.ts` | new (Brand-Kit palette applier + thumbnail renderer) |
| `pixelforge/src/app/core/services/template-thumbnail.service.spec.ts` | new |
| `pixelforge/src/app/core/services/api.service.ts` | modified (add `listTemplates`, `createProjectFromTemplate`) |
| `pixelforge/src/app/core/services/api.service.spec.ts` | modified |
| `pixelforge/src/app/core/models/template.model.ts` | new (TS Template interface) |
| `pixelforge/src/app/app.routes.ts` | modified (add `/gallery/:type`) |

## Definition of Done

All ACs met. 20 templates render in each gallery (once PX-022b has seeded the 20-distribution). Brand-Kit colors visibly applied when non-empty Brand Kit exists. Empty/loading/error states all behave. Tests green. Docs complete. Manual smoke: hub → tile click → gallery → template click → editor opens at right preset.
