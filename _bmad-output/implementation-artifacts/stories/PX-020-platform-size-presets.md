# Story PX-020 — Audit + extend platform size presets

**Epic:** C — Platform Size Presets & Template Gallery
**Sprint:** 1
**Size:** S
**Priority:** P0
**Owner:** Amelia
**Status:** Done
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

- [x] **T-1 · Inspect existing `applyPlatformPreset`**
  - [x] Read `src/app/core/services/export.service.ts`.
  - [x] Document current preset list.
  - [x] Identify any duplicates / inline constants.
- [x] **T-2 · Constants file**
  - [x] Create `src/app/core/constants/platform-presets.ts` with canonical list.
  - [x] Type: `interface PlatformPreset { id: PlatformType; label: string; width: number; height: number; aspect: string; icon?: string; }`.
  - [x] Backend mirror: `backend/app/core/platform_presets.py` + `__init__.py`.
  - [x] Parity guard: `backend/tests/test_platform_preset_parity.py`.
- [x] **T-3 · Refactor `ExportService`**
  - [x] Add `applyPlatformPreset(type: PlatformType): PlatformPreset | undefined` that consumes `PLATFORM_PRESETS`.
  - [x] Re-export `platformPresets` property for consumer discovery.
- [x] **T-4 · Editor query-param support**
  - [x] Read `?platform=` from `ActivatedRoute.snapshot.queryParamMap` in `ngAfterViewInit`.
  - [x] Call `CanvasService.resize(preset.width, preset.height)` — skip the `custom` 0x0 sentinel.
  - [x] Added `CanvasService.resize(width, height): void` (AC-1c).
- [x] **T-5 · ExportDialog**
  - [x] `BATCH_SIZE_PRESETS` now derives from `PLATFORM_PRESETS` (filters out `custom`).
  - [x] Default `selectedBatchSizes` updated to canonical preset labels.
- [x] **T-6 · Tests**
  - [x] `platform-presets.spec.ts` — AC-2 pinning + `getPlatformPreset` coverage.
  - [x] `export.service.spec.ts` — every preset produces expected width/height (AC-3, AC-6).
  - [x] `canvas.service.spec.ts` — `.resize(w,h)` test suite including every MVP dimension (AC-1c).
  - [x] `editor.spec.ts` — 5 cases covering `?platform=ig-post`, `yt-thumb`, `custom`, unknown, missing (AC-5).
  - [x] `backend/tests/test_platform_preset_parity.py` — 4 tests: file exists, count match, tuple parity, custom sentinel.
- [x] **T-7 · Docstrings**
  - [x] TSDoc on every new public symbol (`PlatformType`, `PlatformPreset`, `PLATFORM_PRESETS`, `getPlatformPreset`, `CanvasService.resize`, `ExportService.applyPlatformPreset`, `ExportService.platformPresets`).
  - [x] Google-style docstrings on every new Python symbol (module, dataclass, constants, helper).

## Dev Agent Record

**Agent:** Amelia
**Execution date:** 2026-04-23
**Status:** COMPLETE

### Test results
- Frontend: 255 passing, 0 failing (`npm test`).
- Backend: 31 passing, 0 failing (`pytest`), including 4 new parity tests.
- Parity guard: GREEN.

### Decisions / notes
- `ExportService` did **not** previously contain an `applyPlatformPreset()` or an inline switch — the graphify reference was out-of-date. The new `applyPlatformPreset(type)` method is therefore additive, not a refactor, and returns a `PlatformPreset` record rather than performing a resize itself (keeps the service pure; the Editor does the canvas mutation).
- `ExportDialog`'s existing `BATCH_SIZE_PRESETS` had 8 inline entries (Instagram Post, Instagram Story, Facebook Cover, Twitter Header, YouTube Thumbnail, LinkedIn Post, Pinterest Pin, Square HD). After this story it is derived from the canonical `PLATFORM_PRESETS` (5 entries + `custom` filtered out). This intentionally drops Facebook Cover / Twitter Header / Pinterest Pin / Square HD — they were never in the MVP preset spec (AC-2). Flagged under "Surprises" in the report.
- Parity guard is regex-based (no TS-parser dep added, per story constraint). The regex scans only the body of `PLATFORM_PRESETS: readonly PlatformPreset[] = [...] as const`, so it is isolated from other object literals in the file.
- `CanvasService.resize(w,h)` is a thin wrapper over the existing `setCanvasSize` plus a `requestRenderAll()`. No content scaling (that's what `resizeCanvasWithScale` and `magicResize` are for).

### Follow-ups (out of scope)
- `BATCH_SIZE_PRESETS` lost Facebook Cover / Twitter Header / Pinterest Pin / Square HD. If the PM wants those back they must be added to the canonical preset list (FE + BE + new ids).
- `ExportDialog` still has its own "platformPresets" list (Instagram, Twitter, Facebook, LinkedIn, Email, Print HD, Web Transparent) for quick export **format** selection — that is a different concept from the size presets this story ships. Left untouched.

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

- [x] All ACs met.
- [x] Tests green.
- [x] Docs complete.
- [x] File List matches.
