# Amelia review — Sprint 1 stories

## Verdict
READY WITH CLARIFICATIONS

Core sprint is executable. PX-001 can start today. PX-003 and PX-022 carry blockers that must resolve before they enter dev. PX-020 and PX-010 have a shared-file ordering risk that needs a tiebreaker.

---

## Story-by-story

### PX-001 — Vitest baseline for CanvasService + Editor + ApiService
- Verdict: READY TO EXECUTE TODAY.
- ACs: citable. Coverage thresholds are numeric (AC-1 60%, AC-2 50%, AC-3 70%). AC-4/AC-5 tool-verifiable. AC-6 docstrings map to project-context §6.A. AC-7/AC-8 are scope contracts.
- File List: complete. All three `.spec.ts` paths named; `vitest.config.ts` coverage edit called out.
- Tests per §4.4: YES — vitest, standalone TestBed, `provideHttpClientTesting()` all specified.
- Docstrings per §6.A: YES (AC-6 + T-5).
- Size M is justified (three god-nodes, 3 spec files, coverage config).
- Clarifications needed: none blocking.
- Minor notes:
  - AC-2 "extending any existing spec if one is present" — `editor.ts` has no existing spec per the context section (only 3 spec files enumerated). Confirm and drop the conditional.
  - `vitest.config.ts` currently exists — confirm whether coverage provider (`@vitest/coverage-v8`) is already a devDep. If missing, add to File List.
  - Axe-style a11y check per §4.4 not required for service specs; Editor spec may warrant one (§4.4 last bullet: "page-level component"). Editor is page-level — add or explicitly defer to PX-010.

### PX-002 — `Depends(get_db)` refactor
- Verdict: READY TO EXECUTE after PX-001 establishes frontend baseline (back-end baseline is built here in T-2).
- ACs: citable. AC-1 is grep-verifiable. AC-2/AC-3 are behavioral-equivalence. AC-4 requires tests — T-2 stands up the test harness from scratch, so this is self-sufficient.
- File List: complete but conditional — `asset_routes.py`, `auth_routes.py`, `comments_routes.py`, `collab_routes.py` all marked "if violations found". That's fine; actual diff will resolve.
- Tests per §5.4: YES — pytest-asyncio, `httpx.AsyncClient`, `LifespanManager` all named. §5.4 wants ≥80% branch coverage on `routers/` — story sets only "one 200 happy-path per refactored handler". That's below standard; acceptable for a refactor-only story IFF we treat this as the baseline and backfill in later stories. Flag for Orion.
- Docstrings per §6.B: YES (AC-5).
- Depends-on: PX-001. Dependency is logical (test-first), not hard-blocking since PX-002 builds its own backend test harness. Could run in parallel with PX-001 if two devs.
- Clarifications needed:
  - Confirm FastAPI routes live in `backend/app/*_routes.py` (as stated in PX-002) vs. §5.1's prescribed `backend/app/routers/*.py`. If layout mismatch, PX-002 touches routes at their current location — that's correct and non-controversial — but `docs/project-context.md` §5.1 should eventually be reconciled. Not a blocker.
  - Test MongoDB strategy: AC-4/T-2 says "env-controlled test MongoDB" — confirm `mongomock-motor` (§5.4) vs. real Mongo via docker-compose profile. Pick one before starting.

### PX-003 — Brand Kit SVG logo export
- Verdict: READY WITH CLARIFICATIONS.
- ACs: mostly citable. AC-1 to AC-6 testable. AC-7 sanitization is testable with malicious fixtures.
- File List: T-3 references `src/app/features/brand-kit/components/logos-panel.ts` with explicit "**verify path**" annotation. That's an unverified path — Amelia must grep before starting. Not a blocker but a pre-flight.
- Dependency: DOMPurify is new. T-2 flags "**new dep** → Orion approval". Per §2 rule 10 and project-context §8 Orion escalation list ("new dependencies"), this is a real gate. BLOCKER until approved.
- Tests per §4.4: YES (AC-5 + T-5). Malicious-SVG fixtures called out.
- Backend also touched (AC-6, `asset_routes.py`). §2 rule 2 ("stay in-layer") is violated since this is cross-layer. Story explicitly spans both — that's OK because it's one story, but needs confirmation.
- Docstrings per §6: YES (T-6). Backend handler changes in asset_routes also need Google-style docstrings — add to AC explicitly.
- Clarifications needed:
  - DOMPurify approval (Orion).
  - Confirm `logos-panel.ts` exact path / filename before T-3 starts.
  - Confirm `CanvasService.loadSVGFromString` wrapper exists or must be added (T-4 says "likely already works" — `likely` is not AC-grade).
  - Add explicit docstring AC for backend MIME-list change.

### PX-010 — `/hub` 6-tile chooser
- Verdict: READY WITH CLARIFICATIONS.
- ACs: mostly citable. AC-1 to AC-6 are concrete. AC-7 (WCAG AA) needs axe harness — §4.4 already mandates it for page-level components; story should cite the harness tool.
- File List: complete for the component. One cross-story concern: `platform-presets.ts` is ALSO in PX-020's File List. Same path, both stories "new". This is a collision.
- Dependency order: PX-010 depends on PX-001 only. But it creates `platform-presets.ts` which PX-020 refactors into. If PX-010 ships first, PX-020 becomes a modify-not-new. If PX-020 ships first, PX-010 just imports. Either order works; **PX-020 first is cleaner** since it's smaller (S) and establishes the canonical shape PX-010 consumes.
- Tests per §4.4: YES (AC-8 + T-7). Missing: axe a11y assertion named explicitly despite AC-7 mandating WCAG AA. Add to T-7.
- Docstrings per §6.A: YES (AC-9 + T-8).
- Size M is fair. Not too large to split.
- Clarifications needed:
  - Which file creates `platform-presets.ts` — PX-020 or PX-010? Decision: **PX-020 creates, PX-010 imports**. Update PX-010 File List to `modified` or drop the row.
  - PX-010 T-3 also says "make `/hub` the authenticated default" and edits `auth.interceptor.ts` / route guard. That is claimed as "PX-011 formalizes this — OK to co-implement here." Either split into PX-011 now and defer, or own it here with the AC reflecting the redirect. Currently AC-1..AC-8 do not mention the login-redirect behavior — **add AC-10** if we co-implement, or remove from T-3.
  - `Start from scratch` dialog reuse (AC-5) — confirm which existing dialog. Path/name not given.

### PX-020 — Platform size presets
- Verdict: READY TO EXECUTE after PX-001.
- ACs: fully citable. AC-2 is an enumerated list with exact dimensions. AC-6 test matrix is concrete.
- File List: complete. Note the collision with PX-010 on `platform-presets.ts` — recommend this story owns the `new` row.
- Tests per §4.4: YES (AC-6 + T-6). Editor spec already being created by PX-001; PX-020 modifies it — ordering assumes PX-001 lands first.
- Docstrings per §6.A: YES (T-7) — but T-7 is bare ("Docstrings"). Expand to match PX-001 AC-6 wording.
- Size S is accurate.
- Clarifications needed:
  - Confirm `CanvasService.resize()` exists (T-4: "if missing, add it"). Must decide before start; adding a new public API to a god-node during a preset refactor is exactly the kind of scope creep §2 rule 1 forbids. If missing, split into PX-020a (add resize) + PX-020b (preset refactor).
  - Does `ExportDialog` currently exist at `src/app/features/editor/components/export-dialog.ts`? Path asserted but not verified.

### PX-022 — Seed 20 starter templates
- Verdict: BLOCKED until preconditions resolve.
- ACs: mostly citable. AC-1..AC-8 testable. AC-9 ("copyrightable-safe") is subjective and needs a pass/fail rule (e.g., "no raster images; only fill + text + vector shapes from included set").
- File List: complete shape but 40 asset files (20 JSON + 20 PNG) are treated as atomic. Realistic risk: asset generation (T-1) is ~1 day of Sally design work. Size M is **understated** — this is L/XL.
- Tests per §5.4: YES (AC-8 + T-5). Idempotency + filters covered.
- Docstrings per §6.B: partial. AC says "Docstrings complete" in DoD but no explicit AC or task for Google-style docstrings on `seed_templates()` and new handler filter params. **Add AC-10**.
- Depends on: PX-020 (presets must be canonical first) and Winston's ARD §8.1 (schema). **Winston's ARD §8.1 must be confirmed-present before this story starts** — story references it but reviewer must verify the schema is actually committed.
- Clarifications needed (all blocking):
  - ARD §8.1 template schema: confirm committed at `_bmad-output/planning-artifacts/...`. If not, story cannot start.
  - Sally's visual direction — is she ready to sketch 20 templates? T-1 is 1 day of design work that must be scheduled.
  - Copyright safety (AC-9): define objective check. Proposed: "all layers are type `text`, `rect`, `circle`, `path`, or `polygon`; no `image` type; no external font URLs."
  - Recommend **split** into: PX-022a "seed infra + endpoints + schema tests with 2 fixture templates" (S) and PX-022b "20 production templates" (M, Sally-gated). Current single-story is too large per §6 rule in create-story convention.
  - Resize (PX-022 itself creates `seed/` subtree — confirm `__init__.py` convention matches Python packaging; `assets/templates_canvas_json/*.json` inside the package is fine but large binary thumbnails in git need LFS discussion).

---

## Cross-cutting concerns

1. **`platform-presets.ts` ownership**: PX-010 and PX-020 both list it as `new`. Resolve: **PX-020 creates; PX-010 imports (modified/omit).** Update both File Lists.
2. **Hub login-redirect scope creep**: PX-010 T-3 pulls in auth redirect work that "PX-011 formalizes." Either add AC or defer. Currently ambiguous — violates §2 rule 1 scope discipline.
3. **god-node public-surface growth**: PX-003 and PX-020 both consider adding new public methods to `CanvasService` (`addSvg`, `resize`). Each such addition should be a pre-approved decision, not a "if missing" branch during implementation. Pre-flight these two before sprint kickoff.
4. **Backend routes location**: `docs/project-context.md` §5.1 prescribes `backend/app/routers/` but PX-002 targets `backend/app/*_routes.py`. Not a blocker (story follows reality), but ADR-level clarification recommended.
5. **Coverage ambition asymmetry**: Frontend targets 50–70% (PX-001). Backend §5.4 wants ≥80%. PX-002 only backfills happy-path. Not a blocker for this sprint but must be tracked as technical debt.
6. **No axe/a11y harness named**: §4.4 mandates axe for page-level components. PX-010 AC-7 asserts WCAG AA but doesn't name the tool. Pick `@axe-core/playwright` or Material CDK a11y harness before PX-010 starts.
7. **New dependencies in sprint**: DOMPurify (PX-003), possibly `@axe-core/playwright` (PX-010), `asgi-lifespan` + pytest + pytest-asyncio + httpx (PX-002), `@vitest/coverage-v8` (PX-001), `defusedxml` (PX-003 backend). Each needs Orion sign-off per §2 rule 10. Batch the approval.
8. **Docstring AC wording**: PX-020 T-7 and PX-022 tasks say "Docstrings" without referencing §6 tags. PX-001 does it correctly. Normalize wording across all stories.
9. **PX-022 size**: genuinely L not M. Recommend split.

---

## Stories I can start today, in order

1. **PX-001** — Zero dependencies. Unblocks everyone. Start immediately.
2. **PX-002** — Parallelizable with PX-001 if two devs; otherwise immediately after PX-001 T-1..T-3 (CanvasService tests) proves the testing pattern. Backend test harness is self-contained.
3. **PX-020** — After PX-001 lands. Owns `platform-presets.ts` creation. Small (S), clean AC. Pre-flight: confirm `CanvasService.resize()` presence.
4. **PX-010** — After PX-020 (consumes `platform-presets.ts`). Pre-flight: resolve login-redirect scope + axe harness choice.
5. **PX-003** — BLOCKED on DOMPurify approval + `logos-panel.ts` path confirmation. Unblock, then run after PX-001.
6. **PX-022** — BLOCKED on ARD §8.1 confirmation, Sally design calendar, and split decision (22a infra / 22b content). Run 22a after PX-020; 22b last.

**If forced to start one story right now: PX-001.** No inputs missing, no approvals pending, highest downstream leverage.
