# Pixels — North-Star Vision & Non-Goals

**Author:** Paige (Technical Writer), dispatched by Orion
**Date:** 2026-04-24
**Status:** Draft for review
**Audience:** Every agent (Mary, John, Sally, Winston, Amelia, Paige, Orion) and any future contributor

---

## 1. The North Star

**Pixels is a personal social-media content studio — a free, self-hosted Canva alternative.**

The long-term ambition (12+ months) is to reach feature parity with Canva for the creative jobs-to-be-done that a single operator, small team, or household performs weekly: making polished social posts, logos, thumbnails, and branded visual content without paying a subscription.

The project exists because Canva's paywall blocks specific premium features at the exact moments a user needs them, and the user is unwilling to pay recurring subscription fees for tools that could be self-hosted with open-source building blocks.

### What pixels will feel like when it is "done"

A user opens pixels. They see a hub with content tiles that match the platforms they actually post to (Instagram, LinkedIn, YouTube, logos). They pick one. They land in a gallery of professionally-designed templates with their own brand colors already applied. They pick a template, swap text, drop in a logo, and export in under five minutes. For bespoke logo work, they can create from scratch or upload an AI-generated concept (Midjourney / DALL-E / Leonardo / etc.) and clean it up to a production-ready vector file with their brand palette automatically applied.

---

## 2. MVP Scope (Q2 2026)

The first shippable version, built on top of the existing 946-node `pixelforge` codebase, covers:

| Feature | MVP Status |
| --- | --- |
| 6-tile content hub (IG Post, IG Story, LinkedIn Post, LinkedIn Banner, YouTube Thumbnail, Logo) | ✅ IN |
| Platform size presets in the editor | ✅ IN |
| ~20 seed social-media templates + ~10 seed logo templates | ✅ IN |
| Template gallery with Brand Kit color auto-propagation | ✅ IN |
| Photo editing inside the template editor (filters, crop, BG removal) | ✅ IN — largely already built |
| Logo Creator mode (shape library, text-pairings, layered shapes) | ✅ IN |
| Logo AI-Cleanup mode (import raster → BG remove → vectorize → recolor-to-brand → export) | ✅ IN |
| Multi-format export (PNG, JPG, SVG, ICO multi-size, transparent PNG) | ✅ IN |
| Brand Kit (existing) — extend with logo library + auto-propagation hooks | ✅ IN |
| Accessibility contrast-check (using existing AccessibilityService) | ✅ IN |
| Auth + Projects + Dashboard (existing) | ✅ IN (already built) |

---

## 3. Non-Goals (DEFERRED — NOT IN MVP)

These are good ideas. They are **not** this quarter's work. Every one of them was considered and deliberately cut to protect shipping velocity.

| Feature | Why deferred |
| --- | --- |
| **Video editing** | Requires ffmpeg worker queue, storage budget, streaming preview — separate infrastructure footprint. Revisit Q3+. |
| **Document editing (.doc / .docx)** | Requires libreoffice-headless or pandoc round-trip. Meaningful only after social-media studio is validated. |
| **PDF editing beyond export** | `pdf-lib` stays export-only. Editing existing PDFs is a v1+ pillar. |
| **Presentations** | Overlaps with templates long-term; not urgent. |
| **Whiteboards** | Different interaction model; unrelated to social-post JTBD. |
| **Websites** | Separate product category. |
| **Print-on-demand** | Requires CMYK color, bleed/trim, fulfillment partnerships — out of scope. |
| **Stock library at scale** | Requires licensing or large free-stock integration (Unsplash, Pexels API). Single-user workaround: upload your own. |
| **Team collaboration beyond existing comments** | Single-user / small-household scope keeps auth + permissions simple. |
| **AI image generation** (built-in) | User already uses external AI tools. Cleanup/refine workflow is what matters here. |
| **Mobile native app** | PWA-installable via existing service worker is sufficient for MVP. |
| **Marketplace / sharing templates publicly** | Private-only in MVP. |

---

## 4. Guiding Principles (binding)

1. **Self-hosted by default.** No paid SaaS dependencies. Every runtime dependency must be permissive open-source (MIT, Apache, BSD).
2. **Existing code beats new code.** Pixelforge already has 946 nodes, god-nodes `CanvasService` (70 edges), `Editor` (54), `ApiService` (28). Extend before you create.
3. **Templates are the moat, not editors.** A beautiful empty canvas is a commodity. A template-first hub with brand-kit propagation is the differentiator.
4. **Graph before grep.** The graphify knowledge graph at `pixelforge/graphify-out/graph.json` is the authoritative map of what exists. Consult it before touching code.
5. **Scope is sacred.** No drive-by refactors. No feature creep. Story `File List` is the diff contract. (project-context.md §2)
6. **Every public function documented.** TSDoc / Google-style docstrings on every method, per project-context.md §6.
7. **Every story tests green before merge.** No "it compiles, ship it." (project-context.md §4.4 + §5.4)

---

## 5. Success Metrics (MVP)

The single measurable win for the MVP:

> *"A user can open pixels, pick an Instagram Post template, edit text, swap their logo, and export a 1080×1080 PNG in under 5 minutes — first-time, without reading docs."*

Secondary metrics:

- 0 test regressions week-over-week once the test baseline is established.
- Graphify graph god-node count stable or dropping (no new 50+-edge hubs introduced).
- Every merged PR ships with docstrings on new/changed public symbols (CI-enforced).

---

## 6. What happens after MVP

After MVP ships and is in use:

1. **Sprint 4-5:** Harden photo editing — crop improvements, layer mask, healing brush, curves/levels.
2. **Sprint 6-8:** Expand template library — 100+ templates, more categories (Twitter/X, Pinterest, Facebook), template search & filtering.
3. **Sprint 9+:** Evaluate next pillar based on actual usage data. Decide: PDF editing vs. presentation templates vs. video editing.

The north-star stays Canva-parity for social-media / design work. The sequence is driven by evidence from real usage, not ambition.

---

## 7. Reviewer sign-off

| Reviewer | Role | Status |
| --- | --- | --- |
| Paige | Clarity, docs-standards | ⏳ pending |
| Winston | Architectural non-goals alignment | ⏳ pending |
| John | Scope matches PRD | ⏳ pending |
| Orion | Decisions log consistent | ⏳ pending |
