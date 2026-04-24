# Revisions Tracker

Keeps non-blocking revisions from the 5 review passes so they don't get lost while Sprint 1 dev runs in parallel.

**Revision wave #1 (blocking) applied 2026-04-24T00:06Z** — recorded in orchestrator-log.md.

---

## Wave #2 — queued (non-blocking, apply in parallel with Sprint 1 dev)

### From Paige's review (vision + log)
- [ ] §1 positioning: split "personal social-media content studio" and "Canva alternative" into two sentences. They are related but not the same thing.
- [ ] §1 audience: reconcile with §3 non-goals — "single operator, small team, or household" vs. "team collaboration deferred." Pick one framing; don't mix.
- [ ] Terminology lock across all planning docs: `Pixels` (product) vs `pixelforge/` (codebase directory); `Brand Kit` (title-case) always; `Logo Creator` + `Logo AI-Cleanup` (spelled consistently, capitalized).
- [ ] Success metric §5 — make it measurable at demo time: specify what timing mechanism proves the "under 5 minutes" claim.

### From Sally's review (UX spec)
- [ ] Add a **State Inventory** table: every screen × (empty / loading / error / success).
- [ ] Add wireframe surfaces for stories missing UX: PX-003 (SVG export affordance in Brand Kit), PX-024 (filter empty state), PX-025 (Resize button placement), PX-053 (contrast preview placement), PX-062 (Brand Kit logos in Logo Creator sidebar).
- [ ] Mode chooser: add a "remember my choice" escape hatch for returning users.
- [ ] Brand Kit auto-apply toast: specify exact undo duration and whether it's dismissible.
- [ ] Keyboard-nav spec: enumerate Tab order on each screen.

### From John's review (PRD)
- [ ] Add JTBD traceability for foundation stories: PX-001, PX-002 currently don't trace to a user-facing JTBD — re-frame as "enabling infrastructure for JTBD-1/2/3/4" or as explicit dev-JTBD ("As Amelia, so I can safely extend god-nodes without silent regressions").
- [ ] Persona enrichment: add interview-provenance, device, frequency, and weekly-job-count data for Priya.
- [ ] Success-metric measurability: explicit stopwatch methodology at demo.
- [ ] Add product-level risks to §9: template aesthetics quality, 5-minute claim, Brand Kit onboarding drop-off, AI-cleanup misuse / unrealistic expectations, self-hosted update adoption.
- [ ] Reconcile template count: vision §2 mentions "~20 seed social-media templates + ~10 seed logo templates" but PRD PX-022 says "20 total." Align.
- [ ] Favicon / ICO JTBD ownership: clarify which JTBD drives PX-052.
- [ ] First-time user path when Brand Kit is empty: specify degraded behavior.

### From Winston's review (ARD)
- [x] **DONE in wave #1:** DOMPurify committed as 4th dep.
- [x] **DONE in wave #1:** png-to-ico dropped; Pillow ICO server-side instead.
- [x] **DONE in wave #1:** FE/BE platform-preset parity via pytest guard.
- [x] **DONE in wave #1:** Data migration plan added (§15).
- [x] **DONE in wave #1:** SVG XSS / CSRF / SSRF notes added (§14).
- [ ] Observability: define a minimum logging/metrics plan beyond "console.error → defer Sentry." At least specify: (a) which routes emit structured logs with request_id, (b) a minimal frontend performance-measure for the Hub→Editor flow using `performance.mark`, (c) a per-run cost tracker for graphify runs (already exists in graphify-out/cost.json).
- [ ] svgo actual browser-bundle size: verify via `bundlephobia.com` or `npm-remote-ls`; if > 200KB gzipped, consider a subset plugin-list instead of the full package.

### From Amelia's review (stories)
- [x] **DONE in wave #1:** PX-020 sole owner of `platform-presets.ts`.
- [x] **DONE in wave #1:** PX-022 split into 22a/22b.
- [x] **DONE in wave #1:** PX-010 login-redirect scope removed.
- [x] **DONE in wave #1:** `CanvasService.resize` + `CanvasService.addSvg` made definite.
- [x] **DONE in wave #1:** DOMPurify dep approved in PX-003.
- [ ] Write PX-011 (login-redirect to /hub) — formal story file. Content: modify the post-auth navigation in `AuthService` or route guard so `/hub` is the default instead of `/dashboard`. Small, S-sized, P0.
- [ ] Write PX-012 (tile → `/gallery/:type` routing) — formal story file. Actually partially covered by PX-010's routing task; confirm split or merge.

---

## Wave #2 execution plan

Wave #2 is non-blocking on Sprint 1 dev start but should complete before Sprint 2 planning. Assign to:
- Paige: all Paige + terminology work
- Sally: all UX state + wireframe work
- John: all PRD edits
- Winston: observability plan + svgo bundle check
- Orion: PX-011, PX-012 story files

Target completion: end of Sprint 1 (week 2).

---

## Wave #3 — follow-ups Amelia raised during PX-001 execution (post-delivery, 2026-04-24)

Non-blocking on the current sprint. Queue as individual stories after Sprint 1 P0s are green.

- [ ] **PX-001a — Shared fabric.js test mock.** Extract the `vi.mock('fabric', …)` factory into `src/test/fabric-mock.ts` and import it from both `canvas.service.spec.ts` and `editor.spec.ts`. Today it's duplicated (hoisted-factory constraint). Size: S. Priority: P2.
- [ ] **PX-001b — Editor private-helper integration tests.** `handleSystemPaste`, `loadImageFile`, `dataURLToBlob` need FileReader + ClipboardEvent stubs to lift Editor coverage past 80%. Size: M. Priority: P2.
- [ ] **PX-001c — Canvas snap-guideline unit tests.** Lines 440-683 of `canvas.service.ts` (snap guidelines, equal-spacing detection, `addGuideline`, `addSpacingIndicator`) need a fabric event-loop harness. Today only exercised incidentally. Size: M. Priority: P2.
- [ ] **PX-001d — BrandKit + Template test baseline.** Extend the god-node baseline to `BrandKitService` and `TemplateService` before Sprint 2 touches them for logo/Brand-Kit work. Size: M. Priority: P1.
- [ ] **PX-001e — Typed fabric extension.** Replace in-service `as any` casts on fabric objects by introducing a thin typed wrapper module. Improves refactor safety. Size: M. Priority: P3.
- [ ] **PX-001f — SCSS budget warnings.** Fix SCSS component-style budget warnings on `dashboard/` and `sidebar-drawer` components (pre-existing, surfaced by the clean build). Size: S. Priority: P3.

Queue into Sprint 2 backlog once Sprint 1 P0s close out.
