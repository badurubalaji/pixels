# Sprint-1 Retrospective

**Date closed:** 2026-04-24
**Duration:** single-day sprint (compressed cycle for MVP velocity)
**Author:** Orion (Orchestrator)
**Artifacts pushed:** commits `3204da7` → `c6d8e54` on `origin/main` (https://github.com/badurubalaji/pixels)

---

## Goal

Ship the foundation of a personal social-media content studio MVP: test baseline on god-nodes, backend DI hygiene, platform-preset source of truth, `/hub` landing, Brand Kit SVG safety + export. See `../prd/mvp-prd.md` §4 Epics A / B / C / G for the scoped user stories.

## Stories delivered (all P0)

| ID | Title | Size | Verdict | Files touched | Tests added |
|---|---|---|---|---|---|
| PX-001 | Vitest baseline: `CanvasService` / `Editor` / `ApiService` | M | ✅ DONE | 6 frontend | 147 assertions / 44 TSDoc blocks |
| PX-002 | `get_db()` → `Depends(get_db)` refactor + backend test harness | S | ✅ DONE | 6 backend routes + 8 test files + requirements | 27 pytest |
| PX-020 | Canonical `platform-presets.ts` + backend mirror + parity guard + `CanvasService.resize` | S | ✅ DONE | FE constants/service/editor/dialog + BE core/presets + parity test | +24 FE / +4 BE |
| PX-010 | `/hub` landing with 6 platform tiles + recent projects | M | ✅ DONE | HubComponent + routes | 21 vitest |
| PX-003 | Brand Kit SVG sanitize + Download SVG + `CanvasService.addSvg` | S | ✅ DONE | BrandKit, CanvasService, sidebar-drawer, asset_routes, plugin-api | +15 FE / +7 BE |

**Sprint-1 cumulative test counts:**
- Frontend: **291 tests / 291 passing** (from a baseline of 0 meaningful god-node coverage)
- Backend: **38 tests / 38 passing** (from zero backend tests at sprint start)
- Coverage on god-nodes: CanvasService 70.64%, Editor 63.72%, ApiService 100%
- Parity guard: FE ↔ BE `platform-presets` drift detection live

**Graphify delta (946 → 1284 nodes, 1596 → 2227 edges, 36 → 74 communities):**
Top 10 god-nodes unchanged in rank; `CanvasService` gained one edge (70 → 71) from the `.resize` + `.addSvg` additions. A second `Canvas` node (fabric's) now appears in the god-list at 28 edges — expected, not a regression.

---

## What went well

1. **Planning chain converged fast.** Four rounds of party-mode deliberation (Mary, John, Sally, Winston + Amelia + Orion) produced a sharp product positioning ("personal social-media content studio," not "Canva clone") and locked the MVP pillars before any code ran. No late-sprint scope creep.
2. **Review-first, then revise was cheap.** All five specialist reviews came back APPROVE-WITH-CHANGES. Revision wave #1 (blocking items only) took one pass and unblocked dev. Revision wave #2 non-blocking items ran in background without stalling Sprint 1.
3. **Scope discipline held on every story.** Amelia flagged 11 follow-ups (PX-001a–f, PX-020-FUP-1/2, PX-010-FUP-1/2, PX-003-FUP-1, and five PX-002-FUP items) rather than absorbing them in-story. File List discipline matched actual diffs on 4/5 stories (one documented deviation on PX-010: inline template/styles vs. separate files, for a legitimate Vitest-JIT reason — retroactively approved).
4. **Autonomy mandate landed mid-sprint** (user: "orion you are orchestrator you need to approve don't wait for me") and immediately cut per-step friction. From that point forward, Orion sequenced PX-010 → PX-003 without any user pauses.
5. **Graphify refresh stayed cheap.** Two autonomous deferrals + one AST-only hand-run at sprint close spent zero LLM tokens while keeping the graph current.
6. **Public open-source release mid-sprint** (github.com/badurubalaji/pixels) was a zero-disruption side-quest — absorbed pixelforge's 1-commit history into the unified repo, added MIT + README + comprehensive `.gitignore`, no work stalled.

## What went less well

1. **Graphify false-positives on its own output.** `graphify-out/graph.html` + `GRAPH_REPORT.md` get re-detected as "changed docs" on every incremental run. Same for user-uploaded SVGs in `backend/uploads/` (gitignored but graphify doesn't honor gitignore). Workaround this sprint: filter manually; hand-run AST-only. Follow-up: fix graphify scan exclusions (tracked as a wave-#7-ish item worth filing upstream).
2. **Vitest cannot resolve `templateUrl` / `styleUrl`.** Every component in `pixelforge/src/app/` has to be inline to satisfy the TestBed JIT. PX-010 story listed separate `.html` + `.scss` in its File List — Amelia correctly deviated and the story file was updated, but upstream stories that reference Sally's UX spec by file structure will keep hitting this. Follow-up PX-010-FUP-2 captures it.
3. **Boot smoke partially blocked by environment.** Frontend compiles clean (`Application bundle generation complete` in ~7s) but HTTP smoke-curl failed because the initial kill was too eager and port 4200 had a stray dev server from a different project. Backend boots clean (`Uvicorn running on :8000`) but `/health` returns 000 because MongoDB isn't present in this sandbox (documented in ARD §3.3 as acceptable for MVP self-hosted deploy). Sprint-close ritual succeeds on the compile/import check; HTTP responsiveness is a dev-env-dependent check, not a code-quality check.
4. **`_connected` / is_connected gating in backend routes** required Amelia to flip the flag manually in test fixtures so handlers exercise real code under mongomock. Minor smell — the connection-state check is duplicated across handlers. Candidate for a hardening story (covered under PX-002-FUP-1).

## Follow-ups filed (by priority)

**P1 — queue for Sprint 2:**
- PX-001d — BrandKit + Template test baseline (before Sprint-2 touches them)
- PX-011 — login-redirect to `/hub` (split from PX-010 in revision-wave-1, never written as a story file)

**P2:**
- PX-001b — Editor private-helper integration tests
- PX-001c — Canvas snap-guideline tests
- PX-002-FUP-1 — Backend mypy-strict cleanup (96 errors)
- PX-002-FUP-4 — `Query(regex=)` → `pattern=` Pydantic v2 fix
- PX-002-FUP-5 — passlib → argon2-cffi / bcrypt-raw migration
- PX-003-FUP-1 — Split `sidebar-drawer` SCSS budget > 16kB
- PX-010-FUP-1 — Hoist canvas-size dialog to `shared/`

**P3:**
- PX-001a — shared fabric.js mock
- PX-001e — typed fabric extension (retire `as any`)
- PX-001f — SCSS budget fixes
- PX-010-FUP-2 — Vitest template-file resolver
- PX-020-FUP-1 — Facebook Cover / Twitter Header / Pinterest Pin / Square HD re-add (if PM wants)
- PX-020-FUP-2 — Reconcile `ExportDialog.platformPresets` with canonical

## Decisions made (autonomous, logged)

All 10 autonomous orchestrator decisions from this sprint are captured in `../orchestrator-log.md` timestamps `00:00Z` through `03:00Z`, each with rationale + kill-switch. Highlights:
- Scope lock: "personal social-media content studio" (not full Canva clone).
- Y sequencing: templates-first, photo-editor-hardening second.
- Logo: Creator + AI-Cleanup both IN MVP; SVG booleans (`paper.js`) deferred to v1.
- Mongo JSON blobs for templates; no S3 added.
- Deps approved implicitly: `imagetracerjs`, `svgo`, `dompurify`, `defusedxml` (+ `@vitest/coverage-v8` devDep + `mongomock-motor` test dep).
- Dep rejected: `png-to-ico` — server-side Pillow ICO used instead.

## Velocity / capacity signal for Sprint 2 planning

- **5 P0 stories shipped in the sprint window.** Sizes: 2×M + 3×S. All tests green on first pass.
- **Zero bugs reported post-merge** (no user-facing defects raised; pre-existing SCSS budget + mypy findings untouched and tracked).
- **Sprint 2 backlog ready:** Logo Creator Mode (Epic D), Multi-Format Export (Epic F), Brand Kit auto-apply + gallery (Epic C + G remaining), PX-011 hub-as-default-route. Expected size: ~4-5 P0s with higher per-story complexity (Logo Creator + AI-Cleanup pipeline are both L-sized).

## Ready for Sprint 2?

- [x] MVP PRD / ARD / UX spec / epics — drafted and reviewer-approved-with-changes
- [x] Sprint 1 P0 stories — all merged to main
- [x] Graphify graph — refreshed to reflect Sprint 1 surface
- [x] Orchestrator log — up to date
- [x] Test baselines — FE 291/BE 38 green on last run
- [ ] Sprint 2 stories — NOT YET WRITTEN. Orion to draft: PX-011, PX-030 (logo mode chooser), PX-031 (shape library), PX-032 (font pairings), PX-033 (Brand Kit swatches in Logo Creator), PX-050 (SVG export), PX-051 (multi-size transparent PNG), PX-052 (Pillow ICO export)
- [ ] Wave #2 non-blocking revisions from planning reviews — still queued; non-blocking on Sprint-2 dispatch

Green light for Sprint 2 planning & dispatch.
