# PX-139 — Project Sync: Backend-Fresh Wins + Visible Quota Failures

**Status:** review
**Type:** bug fix (two user-reported regressions, shared root cause)
**Owner:** Amelia (bmad-agent-dev)
**Reporter:** Orion (orchestrator) on behalf of user
**Date:** 2026-04-26

---

## Problem statement

User reported two intermittent bugs in the editor:

1. **Image resize doesn't persist across refresh.** User adds an image from Uploads, drags the corner handles to resize it, leaves and comes back — image is back at the original (unresized) size.
2. **Canvas sometimes shows empty.** Editor occasionally renders a blank canvas after navigation/refresh.

Code analysis (Orion + Explore agent) traced both to `ProjectService` sync logic, not fabric serialization. Verified empirically that fabric 7's `toObject(propertiesToInclude)` includes `scaleX`/`scaleY`/etc. by default — the JSON write path is fine. The bug is on the **read** path.

### Root causes

1. **`ProjectService.mergeProjects()`** at `pixelforge/src/app/core/services/project.service.ts:62-81`:
   ```ts
   const fromApi: Project[] = apiProjects
     .filter(ap => !existingIds.has(ap.id))   // ⚠️ ignores backend version of existing projects
     .map(ap => ({...}));
   return [...existing, ...fromApi];
   ```
   When `syncFromBackend()` runs, it ignores any backend project whose ID is already in localStorage. So once a project has been touched locally, the local version wins forever — even when the backend has a newer `canvas_json`.

2. **`ProjectService.openProject(id)`** at lines 118-149: if the project is found locally, `_currentProject` is set from the local version and **the backend is never queried**. The backend fetch only fires when the project is NOT in local store.

3. **`ProjectService.persistProjects()`** at lines 342-355: silent failure mode. On a localStorage quota error it falls back to slim save (no thumbnail). On a second quota error it just `console.error('localStorage is full')`. Users have no signal that their state isn't persisting — they keep editing, then the next page load reads pre-failure localStorage and the work is gone.

4. **Editor mount polling** at `pixelforge/src/app/features/editor/editor.ts:2001-2018`: when `getCanvasState(projectId)` returns undefined (cold start, cache cleared), the polling waits for `currentProject().canvasJson` to populate. Currently `attempts > 30` with 150ms interval = **4.5 second total timeout**. If the backend response takes longer (cold start, slow network, server still warming), polling gives up and the canvas stays empty with no error UI.

The combination explains both reported symptoms: a silent quota failure poisons localStorage on Tuesday, the user's resize lives only in memory + backend, refresh on Wednesday reads stale localStorage, `mergeProjects` ignores the backend's fresh version, and the editor renders the pre-resize state. If the project isn't in localStorage at all, slow backend → empty canvas.

## Acceptance criteria

- **AC-1.** `mergeProjects(apiProjects)` updates existing project entries with the backend version when `backend.updated_at > local.updatedAt`. Local entries newer than backend stay (offline edits aren't clobbered). New backend-only entries are still appended.
- **AC-2.** `openProject(id)` always issues the backend fetch when `_useBackend()` is true, regardless of whether the project exists locally. If the backend version is newer than the local one (`backend.updated_at > local.updatedAt`), `_currentProject` and the in-memory project entry are both updated. Local `persistProjects()` runs after the update.
- **AC-3.** Editor mount polling timeout extended from 4.5s to 15s. On timeout, a snackbar surfaces ("Couldn't load this project. Try refreshing or going back to /hub.") so the user has a clear signal instead of a silently empty canvas.
- **AC-4.** `persistProjects()` — when the slim-save retry also fails (the second-tier `console.error('localStorage is full')` path), surface a snackbar ("Local storage full — your latest changes only exist in this tab. Refreshing may lose them.") so users know to act before they lose work.
- **AC-5.** Tests:
  - `mergeProjects` — backend newer than local → local entry updated with backend's fields. Backend older than local → local entry untouched. Backend-only project → appended.
  - `openProject` — when backend connected and backend is newer, `_currentProject` ends up with backend fields. When local is newer, local wins.
  - `persistProjects` — when both `localStorage.setItem` calls throw, the snackbar fires.

## Non-goals

- Do NOT modify the multi-page envelope shape (PX-135 contract is stable).
- Do NOT change `saveCanvasState`, `getCanvasState`, or any save-side logic — the bug is read-side.
- Do NOT change `fitToScreen`, `loadFromJSON`, or fabric serialization.
- Do NOT introduce a service-worker / IndexedDB swap — out of story scope.
- Do NOT alter the BMAD test allowlist (`PERSISTED_CUSTOM_PROPS`) — empirically verified fabric 7 already serializes the resize props.
- Do NOT introduce conflict-resolution UI for offline edits — last-writer-wins by `updatedAt` is sufficient and matches the existing optimistic-save pattern.

## File list (diff contract)

Allowed to change:

- `pixelforge/src/app/core/services/project.service.ts` — modify `mergeProjects`, `openProject`, `persistProjects`. Inject `MatSnackBar`.
- `pixelforge/src/app/features/editor/editor.ts` — extend polling attempts (30 → 100, total 15s) + show timeout snackbar.
- `pixelforge/src/app/core/services/project.service.spec.ts` — create if missing; add AC-5 cases. (If a project.service.spec.ts already exists, append; do not rewrite the whole file.)

If your diff exceeds this list, stop and ping Orion.

## Tasks / subtasks

- [ ] **T1.** Inject `MatSnackBar` into `ProjectService` (constructor or `inject()`).
- [ ] **T2.** Replace `mergeProjects` body with last-writer-wins logic by `updatedAt`. Use `Map` keyed by id for O(n) merge. Include all backend fields (canvasJson, thumbnail, name, width, height, updatedAt) when the backend version is newer.
- [ ] **T3.** Modify `openProject(id)`:
  - Keep the optimistic local-first set of `_currentProject`.
  - Always fire the backend fetch when `_useBackend()` is true (drop the `!project` guard).
  - In the backend fetch's `next` callback: compare `backend.updated_at` to local `updatedAt`. If newer (or local is null), update `_projects` entry in-place and re-set `_currentProject`. Persist after.
- [ ] **T4.** In `persistProjects` fallback path: when the second `localStorage.setItem` throws, fire `snackBar.open('Local storage full — your latest changes only exist in this tab. Refreshing may lose them.', 'OK', { duration: 8000 })`.
- [ ] **T5.** In `editor.ts` polling block (line ~2001-2018):
  - Extend `attempts > 30` to `attempts > 100` (15s total at 150ms interval).
  - On the timeout branch, fire `snackBar.open("Couldn't load this project. Try refreshing or going back to /hub.", 'OK', { duration: 8000 })`.
- [ ] **T6.** Tests for AC-5 in `project.service.spec.ts`:
  - `mergeProjects` AC-1 cases (3): backend newer / local newer / backend-only.
  - `openProject` AC-2 cases (2): backend newer wins / local newer wins.
  - `persistProjects` AC-4 case (1): both setItem calls throw → snackBar.open called once.
- [ ] **T7.** Run `npx vitest run` — full suite must stay green.
- [ ] **T8.** TSDoc on the rewritten `mergeProjects` and `openProject` describing the last-writer-wins contract.

## Dev notes

- The existing `mergeProjects` is called from `syncFromBackend()` (line 53-60) which fires from `checkBackend()` constructor → only once per service lifetime. So updating the merge logic only affects the boot-time sync path. Subsequent saves go through `saveCanvasState()` (signal update + persist + backend write), unchanged.
- Use `inject(MatSnackBar)` rather than constructor DI, matching the rest of the project (project-context.md §4.1).
- `_useBackend` is a signal — use `this._useBackend()` to read.
- For testability of `persistProjects`: the existing pattern uses `localStorage.setItem` directly. In tests, stub via `vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('quota') })`.
- Don't use `Date.parse` on `updatedAt` — `Project.updatedAt` is already a `Date` object in local state (line 75 maps `new Date(ap.updated_at)`). Backend's `updated_at` is an ISO string; convert in the merge.

## Done-ness checklist

- [ ] All ACs met.
- [ ] All tasks/subtasks checked off.
- [ ] Vitest green.
- [ ] File List matches actual diff.
- [ ] TSDoc on the modified public/observable behavior.
- [ ] Manual smoke walkthrough by user: open a project, resize an image, refresh — image stays resized. Open a project from a fresh browser session — canvas loads (or shows snackbar after 15s, not silently empty).
- [ ] Dev Agent Record updated with decisions + any surprises.

---

## Dev Agent Record

### Implementation summary

Implemented inline (Orion bypassed Amelia delegation since full context was already loaded — autonomous decision logged in orchestrator-log).

- `project.service.ts` — injected `MatSnackBar`. Rewrote `mergeProjects` as last-writer-wins by `updatedAt` using a `Map<id, Project>`. Added defensive `new Date(updatedAt)` coercion because localStorage round-trips Dates as strings. Rewrote `openProject` to always re-fetch from backend when `_useBackend()` is true, comparing timestamps before replacing local state. Added quota-failure snackbar in the deepest `persistProjects` catch.
- `editor.ts` — extended cold-start polling from 30 attempts (4.5s) to 100 attempts (15s); on final timeout, surfaces a snackbar instead of leaving the canvas silently empty.
- `project.service.spec.ts` — created. 6 cases covering AC-1 (3), AC-2 (2), AC-4 (1).

### Decisions

1. **Map-based merge.** O(n) instead of nested filter/find. Preserves original local order so `/hub` recent-projects strip doesn't reshuffle on every backend sync.
2. **Defensive Date coercion.** `existing.updatedAt` is a string after the localStorage→signal round-trip (JSON drops the prototype). Used `new Date(x).getTime()` which is a no-op for an actual Date and parses for a string.
3. **Spread existing first then incoming.** Preserves any local-only fields (deletedAt, tags, layers) the backend doesn't track.
4. **Did NOT modify `saveCanvasState`, `getCanvasState`, fabric serialization, or the multi-page envelope.** Bug is purely on the read/sync side; save side was already correct.

### File List

- `pixelforge/src/app/core/services/project.service.ts` — modified
- `pixelforge/src/app/core/services/project.service.spec.ts` — new
- `pixelforge/src/app/features/editor/editor.ts` — modified (polling block + snackbar)

### Test evidence

```
$ vitest run src/app/core/services/project.service.spec.ts
Tests  6 passed (6)

$ vitest run
Test Files  27 passed (27)
     Tests  465 passed (465)
```

Was 459 passing before this story → 465 after. Net +6.

### Change Log

- 2026-04-26 — Initial implementation. Last-writer-wins merge + always-fetch openProject + 15s polling + visible quota snackbar. All ACs satisfied. Status → review.

### Caveat for the user

PX-139 fixes the cross-session persistence path. The user's most-acute symptom — image reverting to original size *within the same session* on click-outside-then-click-back — is a separate bug introduced by PX-137 (auto-fit on selection firing every time). That's tracked as PX-140 and being fixed immediately after this PR lands.
