# Paige review — North-Star Vision + Orchestrator Log

## Verdict
APPROVE WITH CHANGES

The vision doc is readable, purposeful, and roughly 90% ready. A handful of clarity fixes and two factual inconsistencies should be resolved before downstream (PRD, ARD, UX) teams treat it as the contract. Orchestrator log is usable but structurally uneven — kill-switch is missing on two entries, and one entry lacks a rationale line.

---

## Strengths

- **Section 1 "feels like when done"** is the single strongest paragraph in the doc. It grounds an abstract positioning statement in a concrete five-minute user journey — exactly the kind of concrete imagery that stops agents and humans from projecting their own interpretation onto "Canva alternative."
- **Section 3 non-goals table** is defensible: each row cites a *mechanical* reason (ffmpeg, libreoffice, CMYK, licensing) rather than a vague "out of scope." That's the right altitude — it tells a future contributor *why* the line was drawn, not just *where*.
- **Principle 4 ("Graph before grep")** is an unusually sharp principle for an early-stage vision doc. It ties guidance to a concrete artifact path (`graphify-out/graph.json`), which is exactly how principles avoid becoming wallpaper.
- **Section 5 primary metric** is excellent — it is time-boxed, observable end-to-end, and the "without reading docs" clause makes it falsifiable. This is the one metric I would put on a dashboard.
- **Section 6 sequencing narrative** ("driven by evidence from real usage, not ambition") correctly reframes the roadmap as a decision tree, not a commitment.
- **Orchestrator log §2026-04-24T00:00:00Z** captures the kill-switch explicitly and names what the user *didn't* do ("did not invoke it across two consecutive asks") — that's the gold standard for auditability. Replicate this pattern on every entry.

## Required changes (must-fix before downstream work)

1. **Fix the date inconsistency.** Doc header says `Date: 2026-04-24` but today's date (per environment) is `2026-04-23`. The orchestrator log also uses `2026-04-24T00:00:00Z`. Either the doc is post-dated by one day (say so explicitly) or both docs need to be set to `2026-04-23`. Downstream agents will anchor timelines off these dates.

2. **§1 positioning statement is two statements fighting each other.** The line *"Pixels is a personal social-media content studio — a free, self-hosted Canva alternative"* mixes a narrow claim (social-media studio) with a sweeping one (Canva alternative). A reader cannot tell which is the positioning and which is the aspiration. Rewrite as: *"Pixels is a free, self-hosted social-media content studio. Its long-term ambition is Canva-parity for personal creative work."* Two sentences, no em-dash ambiguity.

3. **Reconcile "single operator, small team, or household" (§1) with the non-goal "Team collaboration beyond existing comments" (§3).** If the audience is a team, collaboration is load-bearing; if it is single-user, say so and drop "small team." Currently §1 invites a team-use interpretation that §3 then silently revokes. This will cause PRD persona drift. Recommend: keep "single operator or household" in §1; drop "small team."

4. **Orchestrator log — kill-switch missing on two entries.** `2026-04-24T00:03:00Z` (dependency approval) and `2026-04-24T00:05:00Z` (dispatch wave) have no kill-switch line. The doc's own convention and SKILL.md R7 imply every autonomous decision carries a reversal path. Add one to each, even if it reads *"Kill-switch: reject any artifact during specialist review."*

5. **Orchestrator log entry §2026-04-24T00:05:00Z has no rationale.** It's a dispatch list without a "why now" line. Add one sentence on why these five agents dispatch in parallel vs. sequentially — e.g. *"Parallel dispatch chosen because artifacts have no hard blocking dependency on each other at draft stage; review gates handle consistency."*

## Suggested improvements (nice-to-have)

- **Add a diagram to §1.** A simple hub → template gallery → editor → export flow diagram (ASCII or Mermaid) would replace ~60 words of prose in "What pixels will feel like when it is done" with one glanceable artifact. This doc's audience is agents; diagrams parse faster than prose for both humans and LLMs.
- **Principle 2 ("Existing code beats new code")** buries the rule inside a statistic. Lead with the rule: *"Extend before you create. The pixelforge codebase has 946 nodes and three god-nodes (CanvasService 70e, Editor 54e, ApiService 28e) — if a capability exists, reuse it."* The current phrasing makes readers parse the god-node list before they find the imperative.
- **Principles 5, 6, 7 all cite `project-context.md`** — consider a single footnote or a "Binding sources" line at the end of §4 rather than three inline citations. Reduces visual noise without losing the provenance.
- **§2 MVP table "IN" vs. "IN — largely already built"** — introduce a fourth column "Status" with values like NEW / EXTEND / DONE. "✅ IN" with a qualifier appended to some cells is mildly inconsistent and harder to scan.
- **§5 secondary metrics** could name the measurement mechanism. "Graphify graph god-node count stable or dropping" is measurable in principle; naming the cadence (per merged PR? weekly?) makes it operational.
- **Orchestrator log** would benefit from a table-of-contents or short index at the top once it exceeds ~10 entries. Currently scannable, but it will not stay that way.
- **Orchestrator log §2026-04-24T00:01:00Z** — the phrase "Option Y" is used without defining X and Y upfront. A reader landing on this entry cold cannot tell what Y means without reading the user quote carefully. Recommend one-line preamble: *"Options on table: (X) photo-editor first per user's stated order, (Y) templates first, (both) parallelize."*

## Terminology inconsistencies flagged

- **"Pixels" vs. "pixelforge"** — the product is "Pixels" (capitalized) in §1 positioning statement; the codebase is "pixelforge" (lowercase, compound). In §1 line *"A user opens pixels"* the product name loses its capitalization. Lock it: **Pixels** = product, **pixelforge** = repo/codebase. Apply consistently. Currently "pixels" (lowercase, product) appears at least 4 times.
- **"Brand Kit" vs. "brand kit" vs. "brand-kit"** — §2 uses "Brand Kit" (proper noun), §4 principle 3 uses "brand-kit" (hyphenated, lowercase). Pick one canonical form. Recommend **Brand Kit** since it is a named feature, not a generic concept.
- **"Logo Creator" / "Logo AI-Cleanup" / "Creator mode" / "AI-Cleanup mode"** — the two sub-features have two different spellings in §2 vs. orchestrator log §2026-04-24T00:02:00Z ("Creator and AI-Cleanup modes"). Canonicalize as **Logo Creator** and **Logo AI-Cleanup** (both title case, hyphen on Cleanup). Use these exact strings in PRD/ARD/UX.
- **"jobs-to-be-done" vs. "JTBD"** — §1 spells it out, non-goals table §3 uses "JTBD" without prior definition in that table. If PRD/ARD readers jump straight to §3, they'll stall. Use full form on first mention per section, or add a glossary.
- **"v1" vs. "v1+" vs. "Sprint 4-5" vs. "Q3+"** — the doc uses four different horizon labels: sprint numbers, version numbers, quarter markers, and "after MVP." §3 says PDF editing is "v1+ pillar"; §6 talks in sprint numbers; §2 header says "Q2 2026." Pick one timeline vocabulary (recommend: MVP / post-MVP / v1 / v2) and map sprint numbers to it in a single table.
- **"946 nodes"** — cited in both §2 body and §4 principle 2. Fine once, but it reads like incantation when repeated. Cite it once with a link to `graphify-out/graph.json` and let principle 2 say "the existing graph" without re-stating the count.
- **Orchestrator log "project-context.md §R6" vs. "project-context.md §2" / "§4.4 + §5.4" / "§6"** — the section-reference style varies. `§R6` (rule format) vs. `§2` (section format) implies two different documents or two different numbering schemes in the same doc. Clarify which it is and normalize.

---

**Bottom line:** The vision is clear enough to dispatch against *today* provided the §1 positioning is tightened, the audience contradiction (team vs. single-user) is resolved, and terminology is locked before PRD / ARD / UX start writing. None of these are load-bearing-broken; all are achievable in a 30-minute edit pass.
