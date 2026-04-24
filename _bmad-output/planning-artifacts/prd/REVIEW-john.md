# John review — MVP PRD

**Reviewer:** John (Product Manager)
**Date:** 2026-04-23
**Document reviewed:** `mvp-prd.md` (2026-04-24 draft)
**Supporting artifacts:** `../vision/north-star-vision.md`, `../ux-spec/ux-wireframe-spec.md`

## Verdict
**APPROVE WITH CHANGES**

The PRD is structurally sound, scope is clearly framed against the north-star vision, and the JTBD spine is visible. But three things stop it from being ready for Amelia to execute against: (1) personas are under-specified for decision-making, (2) three P0 stories are either unlinked to a JTBD or are engineering chores masquerading as P0 product, and (3) the success-scenario metric is directional, not measurable at demo time.

---

## Strengths

- **Positioning sentence is sharp.** One sentence, explicit "not a Canva clone," quantified ("under 5 minutes"). This is the test every future story should pass.
- **JTBD framing is present and numbered.** Four JTBDs, each in "When / I want to / So I can" form. Good.
- **Non-goals reference the vision doc by section — traceability is real,** not lip-service. §8 hard-references `north-star-vision.md` §3.
- **T-shirt sizing + priority on every story.** P0/P1/P2/v1 columns let us cut scope under pressure without reopening the doc.
- **Dependency intake table (§7) is honest:** lists licenses, sizes, purpose, and explicitly names the *rejected* alternatives (`paper.js`, `vtracer`) with reason. Rare and excellent.
- **Acceptance criteria §5 bakes in project-context discipline** (god-node tests, docstrings, graphify refresh) — not just feature ACs.

---

## Scope / priority concerns (must-fix)

### 1. PX-001 and PX-002 should not be P0 in a product PRD
These are engineering hygiene items (Vitest baseline, `Depends(get_db)` audit). They have no user-facing outcome and don't trace to any JTBD. **They belong in a separate "Sprint 0 technical hardening" track**, not in the same priority bucket as PX-010 (Hub exists). If the ship date slips and we cut P0, we cannot cut PX-010 but we can absolutely cut PX-001. That's the definition of not-P0-equal.
- **Fix:** Move PX-001, PX-002 to a new §4.0 "Technical Foundation (parallel track)" with their own priority scheme, or drop them to P1 with a note that they block merging other P0s.

### 2. PX-045 ("after Cleanup I can freely edit in Logo Creator") is P0 but not demoable in 5 minutes
If Logo Creator's shape library (PX-031) is P1, then PX-045 promises an editing surface whose primitives are P1. **The handoff to "Edit in Creator" is P0, but what the user can actually do there is deferred.** This is a product trap — users will tap "Edit" and find an empty toolbox.
- **Fix:** Either promote PX-031 to P0 (minimum viable shape set — even 10 shapes) or scope PX-045 down to "reopen-in-editor without shape-library dependency."

### 3. PX-022 (seed 20 templates) is P0 sized M — this is 20 design artifacts, not a coding task
20 templates × [layout + brand-kit-slot wiring + thumbnail render] is a designer's sprint, not a developer's afternoon. Underestimated. Also: north-star-vision.md line 31 promises **"~20 seed social-media templates + ~10 seed logo templates"** = 30 total. PRD only calls for 20. Mismatch.
- **Fix:** Reconcile the number (20 or 30?) and re-size PX-022 to L. Consider splitting into PX-022a (5 templates to prove the pipeline) as P0 and PX-022b (remaining 15-25) as P1.

### 4. PX-025 "Resize for IG Story" is marked P2 but wireframe §5 lists it as a named editor feature
Wireframe documents it with a callout: *"Resize for..." action — one-click clone-to-new-platform.* That's PM-level commitment language for a P2. Either the wireframe overpromises or the priority under-promises.
- **Fix:** If P2, remove from wireframe §5 additions. If keeping in wireframe, elevate to P1.

### 5. PX-060 Brand Kit auto-apply is P0 — but has no fallback behavior specified
"Applied your Brand Kit. Undo?" — what happens when the user has **no** Brand Kit yet (first-time user)? The success scenario in §5 assumes the user has a logo to drop in. First-time-user path is undefined.
- **Fix:** Add story PX-063: "As a first-time user with no Brand Kit, I see a gentle prompt to set one up from the first template load, and templates render with default palette fallback."

---

## Traceability gaps (user stories that don't link to a JTBD)

Every story should map to one of the four JTBDs. Audit result:

| Story | JTBD? | Notes |
|-------|-------|-------|
| PX-001 | **None** | Engineering chore. Remove from PRD or move to tech-foundation track. |
| PX-002 | **None** | Same. |
| PX-003 | JTBD 4 (weakly) | Export logo as SVG is really about brand consistency — make the link explicit in the story text. |
| PX-010, 011, 012 | JTBD 1 | Clear. |
| PX-020–025 | JTBD 1 | Clear. |
| PX-030–033 | JTBD 2 | Clear. |
| PX-040–046 | JTBD 3 | Clear. |
| PX-050, 051 | JTBD 3 / JTBD 2 | Fine. |
| PX-052 (ICO) | **Weak link** | ICO is for favicons — is that a JTBD the personas actually have? Priya posts to IG/LinkedIn; favicons are a website-owner concern. Interrogate before keeping as P1. |
| PX-053 (contrast preview) | **Weak link** | Accessibility is nice but no JTBD says "I need my logo to pass contrast." Consider P2 → v1. |
| PX-060–062 | JTBD 4 | Clear. |

- **Fix:** Add a "JTBD" column to the story tables in §4, and force every story to cite one. Stories with no JTBD need to either get one or get cut.

---

## Persona specificity gaps

Priya is decent but still abstract. Blockers:
- **No frequency data.** "3-5×/week" — but what content type ratio? 80% IG / 20% LinkedIn? Affects template seed priorities.
- **No device mix.** Mobile-first or desktop-first? Wireframes commit to responsive 1×6 mobile stack; if Priya is desktop-dominant this is over-investment.
- **No failure-mode data.** What does Priya do *today* when Canva paywalls her? Does she abandon the post, pay the one-time, screen-record a workaround? Knowing this tells us which JTBD is actually urgent vs. theoretical.
- **"Ashulabs Household" is too thin to be a persona.** It's a deployment context. Either remove or expand with specific shared-use scenarios (e.g., does mom's Brand Kit conflict with daughter's in the same instance?).

- **Fix:** Before implementation, run ≥3 real Priya-proxy interviews (or have orchestrator-log cite where this data came from) and tighten §2.

---

## Risk coverage gaps

§9 risk table is engineering-biased. Missing **product risks**:

1. **Template aesthetic risk.** 20 templates can feel ugly even when they work. Who's the design authority? No risk row on "templates ship but look amateur compared to Canva." Mitigation must name: will we hire/commission a designer or use open-source template sources?
2. **The 5-minute claim is a marketing promise.** If first-time users take 8 minutes, the success scenario fails and morale drops. No risk row on "5 minutes turns out to be the wrong bar." Mitigation: A/B first-time time-to-export during internal dogfood.
3. **Brand Kit onboarding drop-off.** JTBD 4 depends on a populated Brand Kit. If setup is friction-heavy, every downstream JTBD degrades. No risk row. Mitigation: a lightweight "detect from upload" or "one-tap default palette" pattern.
4. **AI-Cleanup user-intent mismatch.** Priya may upload a *photo* to Cleanup, not an AI logo — and the pipeline will vectorize it into garbage. No risk row on "misuse path." Mitigation: input validation with a "This looks like a photo — are you sure?" interstitial.
5. **Self-hosted update risk.** Priya installs v0.1, never updates. When we ship v0.2 with PX-025 smart-reflow, she doesn't know. No risk row on update-adoption for a self-hosted product.

- **Fix:** Add the five rows above to §9.

---

## Non-goals completeness — anything sneaking back in?

Non-goals (§8) reference the vision doc, which is fine. But checking for whispers:

- **PX-053 (contrast preview)** — vision §3 defers "AI image generation" but does not defer accessibility tooling. Keep or reject explicitly.
- **Wireframe §6 "Recent logos"** — listed on mode-chooser screen. Is this an organization feature? North-star §3 defers "Marketplace / sharing templates publicly" but not internal organization. OK, but flag as scope for design review.
- **PX-025 "Resize for IG Story" with smart reflow** — north-star explicitly mentions cross-platform resize as a Canva differentiator. P2 is right; but "smart reflow" is a big promise. Explicitly state that "smart" in MVP = proportional rescale + center-keep, not ML layout.

- **Fix:** Add §8.1 "Features users may ask for and will be deferred": smart layout AI, magic eraser, undo-history-beyond-session, cross-project brand propagation.

---

## Success metric must become measurable

§5's success scenario reads like a story, not a metric. For demo day:

- **Who** counts as "a new user"? Someone who has never seen the app, or an internal household member?
- **Under 5 minutes from what starting point?** Cold-browser-open? Post-login? The stopwatch definition is missing.
- **"Without reading docs"** is measured how? Is there tooltips/onboarding on-screen — do those count as docs?
- **What counts as failure?** User asks us a question mid-flow — do we answer or stay silent?

- **Fix:** Rewrite §5 success criterion with an operational protocol (e.g., "3 out of 3 internal dogfood users, post-login stopwatch, no verbal assistance, export completes in ≤5 min. Tooltip/aria-label hover counts as zero-assist").

---

## Questions still to answer with user

1. **Template aesthetic:** will we commission templates from a designer, seed from open-source (e.g., Penpot/Figma community), or have the product team design them? This gates PX-022 feasibility and cost.
2. **Priya research provenance:** is the Priya persona derived from actual conversations with solo creators, or extrapolated from the user's household experience? Flag from John: PRDs emerge from interviews; we need a citation.
3. **20 vs 30 templates:** vision doc says 30 total (20 social + 10 logo), PRD says 20. Which number is binding?
4. **Favicon/ICO JTBD:** which persona actually needs favicons? If Priya doesn't run a website, PX-052 belongs in v1.
5. **Default mode for Logo chooser:** wireframe §6 flags this as an open Orion escalation. Decide before Sprint 2 starts.
6. **First-time-user path:** what is the onboarding story for a user with no Brand Kit and no projects? Currently undefined — impacts every hub/gallery/editor flow.
7. **Success-metric protocol:** see §5 fix above. Who runs the stopwatch test and on which users?
8. **PX-025 smart-reflow definition:** what does "smart" mean in MVP vs. v1?

---

## Minor edits

- §1: "under five minutes per artifact" — tighten to match §5's single success scenario (currently §1 says "per artifact" but §5 measures one artifact, not an average).
- §4 Epic A header says "Sprint 0–1" but PX-001/002 are foundation — consider Epic A → "Sprint 0" only to avoid overlap signaling.
- §10: John's self-review is marked ✅ but this review document didn't exist when that check was made. Un-check it and let this review be the sign-off.
- §7: `svgo` sized at "~300KB dev-dep or client bundle, lazy-loaded" — pick one. Bundle impact changes the NFR conversation.

---

## Gate

Do not hand to Amelia for story-refinement until items 1-5 in "Scope / priority concerns" and the success-metric rewrite are closed. Traceability column addition is a 30-minute edit and should precede any other change. Everything else can be iterated in review rounds with Winston and Sally.
