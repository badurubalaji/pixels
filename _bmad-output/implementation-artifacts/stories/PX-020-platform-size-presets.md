# Story PX-020 — Audit + extend platform size presets

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 1
**Size:** S
**Priority:** P0
**Owner:** Amelia
**Status:** Ready for dev
**Depends on:** PX-001

---

## Context

`ExportService.applyPlatformPreset()` was surfaced in graphify (Community 8, cohesion 0.12) but its current list of supported presets is unknown until we read the file. The Hub UX (`PX-010`) needs these presets to be canonical, centralized, and complete for the 5 MVP platforms + Logo (no size).

---

## Acceptance Criteria

- **AC-1** — All platform presets live in a single source of truth at `src/app/core/constants/platform-presets.ts`. **This story is the sole owner** of this file (per revision-wave-1; PX-010 was originally co-creating it, now deferred).
- **AC-1b** — Matching backend source of truth at `backend/app/core/platform_presets.py` exporting the same list with identical ids/labels/dims. Pytest guard `backend/tests/test_platform_preset_parity.py` fails CI if FE and BE drift (per ARD §7.1, revision-wave-1).
- **AC-1c** — `CanvasService.resize(width: number, height: number): void` is added to `src/app/core/services/canvas.service.ts` and invoked by `Editor` when a platform preset is applied. Unit-tested in `canvas.service.spec.ts`. (Previously this was conditional in PX-020; revision-wave-1 makes it definite.)
- **AC-2** — The constants file exports:
  - `ig-post` → 1080×1080 (square)
  - `ig-story` → 1080×1920 (9:16)
  - `linkedin-post` → 1200×627 (1.91:1)
  - `linkedin-banner` → 1584×396 (4:1)
  - `yt-thumb` → 1280×720 (16:9)
  - `custom` → user-defined (nullable)
- **AC-3** — `ExportService.applyPlatformPreset(type: PlatformType)` consumes this constants file rather than an inline switch.
- **AC-4** — `ExportDialog` shows the current preset label and allows switching to any preset from the list.
- **AC-5** — The editor (`Editor` component) accepts a `?platform=<type>` query param on load and applies the matching preset to the canvas via `CanvasService.resize()`.
- **AC-6** — Unit tests cover every preset (dimensions, aspect ratio).
- **AC-7** — Scope discipline: no other changes to `ExportService` or `Editor` logic.

## Tasks / Subtasks

- [ ] **T-1 · Inspect existing `applyPlatformPreset`**
  - [ ] Read `src/app/core/services/export.service.ts`.
  - [ ] Document current preset list.
  - [ ] Identify any duplicates / inline constants.
- [ ] **T-2 · Constants file**
  - [ ] Create `src/app/core/constants/platform-presets.ts` with canonical list.
  - [ ] Type: `interface PlatformPreset { id: PlatformType; label: string; width: number; height: number; aspect: string; icon?: string; }`.
- [ ] **T-3 · Refactor `ExportService`**
  - [ ] Replace inline switch with lookup into the new constants file.
  - [ ] Keep public signature stable.
- [ ] **T-4 · Editor query-param support**
  - [ ] In `Editor` component ngOnInit (or equivalent effect), read `?platform=` from `ActivatedRoute.queryParams`.
  - [ ] Call `CanvasService.resize(preset.width, preset.height)`. If `CanvasService.resize` doesn't exist, add it.
- [ ] **T-5 · ExportDialog**
  - [ ] Ensure dialog renders the list of presets from the constants file.
- [ ] **T-6 · Tests**
  - [ ] `export.service.spec.ts` — every preset produces expected width/height.
  - [ ] `editor.spec.ts` — mock ActivatedRoute with `?platform=ig-post` → asserts canvas resized to 1080×1080.
- [ ] **T-7 · Docstrings**

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/core/constants/platform-presets.ts` | new (sole owner of this file; PX-010 depends on it) |
| `pixelforge/backend/app/core/__init__.py` | new (if missing) |
| `pixelforge/backend/app/core/platform_presets.py` | new (FE/BE parity per ARD §7.1) |
| `pixelforge/backend/tests/test_platform_preset_parity.py` | new (CI-guard for FE/BE drift) |
| `pixelforge/src/app/core/services/export.service.ts` | modified |
| `pixelforge/src/app/core/services/export.service.spec.ts` | new or modified |
| `pixelforge/src/app/features/editor/editor.ts` | modified |
| `pixelforge/src/app/features/editor/editor.spec.ts` | modified |
| `pixelforge/src/app/features/editor/components/export-dialog.ts` | modified |
| `pixelforge/src/app/core/services/canvas.service.ts` | modified (definite `resize()` add per AC-1c) |
| `pixelforge/src/app/core/services/canvas.service.spec.ts` | modified |

## Definition of Done

- [ ] All ACs met.
- [ ] Tests green.
- [ ] Docs complete.
- [ ] File List matches.
