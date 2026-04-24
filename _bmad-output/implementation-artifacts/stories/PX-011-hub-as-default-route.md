# Story PX-011 — `/hub` is the default post-login landing

**Epic:** B — Content Hub & Navigation
**Sprint:** 2
**Size:** S
**Priority:** P0
**Owner:** Amelia
**Status:** Ready for dev
**Depends on:** PX-010 ✅

---

## Context

PX-010 built `/hub` as a direct-nav-only route. Per revision-wave-1, the default-redirect work was deliberately split out of PX-010 to keep that story's diff narrow. This story completes the loop: logged-in users land on `/hub`, not `/dashboard`.

Sprint-1 retro noted `/hub` is "direct-nav-only until PX-011 lands" — this story lands it.

---

## Acceptance Criteria

- **AC-1** — After successful login (`AuthComponent.submit()` / token grant), the user is navigated to `/hub` (not `/dashboard`).
- **AC-2** — After successful signup, the user is navigated to `/hub`.
- **AC-3** — A logged-in user who hits the root path `/` is redirected to `/hub` (not `/dashboard`).
- **AC-4** — A logged-in user who hits `/dashboard` directly still gets Dashboard (no forced redirect of explicit nav).
- **AC-5** — An unauthenticated user who hits `/hub` is redirected to `/auth` (preserve existing auth guard behavior).
- **AC-6** — On "continue as guest" path: same — `/hub` is the landing.
- **AC-7** — Scope discipline: no UI changes to Dashboard, no changes to `/hub` beyond the redirect plumbing, no behavior change on `/editor/:id` or any project flow.
- **AC-8** — Unit tests cover each redirect path (login success, signup success, root path, guest path, unauthenticated access to `/hub`).

## Tasks / Subtasks

- [x] **T-1 · Audit current post-login navigation**
  - [x] Read `src/app/features/auth/auth.ts` / `auth.service.ts`. Find every `router.navigate([...])` call that lands post-auth.
  - [x] Read `src/app/app.routes.ts` for the root-path default route.
  - [x] Read any route guards (`src/app/core/guards/*.ts` or similar) that govern `/hub` access.
- [x] **T-2 · Change post-auth targets**
  - [x] Replace every post-login / post-signup / post-guest `navigate(['/dashboard'])` with `navigate(['/hub'])`.
  - [x] If a query-param return-URL pattern exists (`?returnTo=...`), preserve it — honor return-URL first, fall through to `/hub` only when none.
- [x] **T-3 · Root-path redirect**
  - [x] Change `{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }` (or equivalent) to redirect to `'hub'`.
- [x] **T-4 · Auth guard on `/hub`**
  - [x] Verify `/hub` route has the functional auth guard (`canActivate: [authGuard]` or equivalent). If missing, add it. Reuse existing guard — do not create a new one.
- [x] **T-5 · Tests**
  - [x] `auth.service.spec.ts` or `auth.spec.ts` — extend to assert `navigate` was called with `['/hub']` on successful login / signup / guest paths.
  - [x] `app.routes.spec.ts` OR a small routing-integration test — assert `/` redirects to `/hub` when authenticated.
  - [x] Unauthenticated `/hub` hit redirects to `/auth` (guard behavior preserved).
- [x] **T-6 · Docstrings on touched public symbols.**

## Dev Agent Record

**Agent:** Amelia (bmad-agent-dev)
**Completed:** 2026-04-23

### Audit findings (T-1)
- `src/app/features/auth/auth.ts` — two post-auth `navigate` calls, both to `['/']` (lines 225, 247 pre-change): post-login/signup success and guest.
- `src/app/core/services/auth.service.ts` — no navigation owned by the service; auth component owns nav.
- `src/app/app.routes.ts` — root `path: ''` previously mounted `DASHBOARD_ROUTES` (so `/` rendered Dashboard). Wildcard redirected to `''`.
- No pre-existing functional auth guard — none found under `src/app/core/`. Created one: `src/app/core/guards/auth.guard.ts`.
- No pre-existing `?returnTo=` pattern — kept scope tight, did not introduce one.

### Decisions
1. **`/dashboard` promoted to a real path.** Previously Dashboard lived at `''`. To satisfy AC-4 ("explicit `/dashboard` nav still works") while also satisfying AC-3 (root redirects to `/hub`), moved Dashboard to `path: 'dashboard'` and made root a pure redirect.
2. **New functional `authGuard` created.** The story said "reuse existing authGuard" but none existed. AC-5 requires a redirect, so a guard is unavoidable — created the minimal functional guard using `router.parseUrl('/auth')` for declarative redirect.
3. **Wildcard `'**'` now redirects to `hub` (was `''`).** Same user-visible behavior now that `''` → `hub`, but more explicit — unknown URLs land on the hub (which itself bounces unauth users to `/auth`).
4. **No `returnTo` plumbing** — no AC requires it, and none existed; kept per Rule 3 (no speculative additions).

### Test evidence
- `src/app/features/auth/auth.spec.ts` — 5 new tests covering AC-1, AC-2, AC-6 + loading-flag hygiene + failure path.
- `src/app/core/guards/auth.guard.spec.ts` — 2 new tests covering AC-5 (authenticated true; unauthenticated returns `UrlTree('/auth')`).
- `src/app/app.routes.spec.ts` — 6 new tests covering AC-3, AC-4, AC-5 (route table shape).
- Total: **13 new tests**, all passing.
- Full FE suite: **304 passed / 0 failed** (was 291 at Sprint-1 close; +13 new).
- `tsc --noEmit -p tsconfig.app.json`: clean.

### Files modified
- `pixelforge/src/app/features/auth/auth.ts`
- `pixelforge/src/app/app.routes.ts`

### Files created
- `pixelforge/src/app/core/guards/auth.guard.ts`
- `pixelforge/src/app/core/guards/auth.guard.spec.ts`
- `pixelforge/src/app/features/auth/auth.spec.ts`
- `pixelforge/src/app/app.routes.spec.ts`

### Surprises / follow-ups (out of scope)
- `AuthComponent.submit`'s `onError` uses `err: any` — pre-existing violation of project-context §4.5 (no `any`). Left alone per Rule 1 (scope discipline); worth a tiny separate chore story.
- Dashboard now mounted at `/dashboard` instead of `/`. If any external link, test, or doc linked to `/` expecting Dashboard, it will now land on `/hub`. No such links found in a repo-wide grep (`'/dashboard'`, `"/dashboard"`, `path: 'dashboard'` all turned up nothing before this change).

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/features/auth/auth.ts` | modified (navigation target) |
| `pixelforge/src/app/core/services/auth.service.ts` | modified (if it owns post-login navigate) |
| `pixelforge/src/app/app.routes.ts` | modified (root-path redirect) |
| `pixelforge/src/app/features/auth/auth.spec.ts` | new or modified |
| `pixelforge/src/app/core/services/auth.service.spec.ts` | new or modified |

## Definition of Done

- All ACs met. All tests green. Docs updated. File List matches diff. Manual sanity: login → lands on /hub.
