# Sally review — UX Wireframe Spec

**Reviewer:** Sally (UX Designer)
**Date:** 2026-04-23
**Artifacts under review:** `ux-wireframe-spec.md`, `mvp-prd.md`

---

## Verdict
**APPROVE WITH CHANGES**

The spec is strong in its bones — the three-clicks-to-editing narrative sings, the hub-as-front-door framing anchors the whole experience, and the twin-flow treatment of Logo Creator vs AI-Cleanup respects the very different mental models users bring to each. But there are real gaps: the spec is thin on the "in-between" moments (loading, empty, error, success) that make or break a product's felt quality, and accessibility is gestured at rather than specified. These are the kind of fixes that turn a good wireframe into a great one.

---

## UX strengths

- **The hub as deliberate front door.** Replacing the blank-canvas-first default with a 6-tile chooser is the single highest-leverage move in this spec. It tells Priya "here is what this tool is for" in under a second. The inclusion of tile dimensions (1080×1080 etc.) quietly educates new users on platform specs without a tutorial.
- **Brand Kit propagation with a forgiveness loop.** The 7-second toast with "Undo?" on auto-apply is exactly the right pattern — it honors JTBD 4 (brand consistency) without locking users into a bad color mapping on first contact.
- **Two modes, two UIs for Logo.** Principle 5 is correct: toggling a single logo surface between "create" and "clean up" would punish both audiences. The current split respects the cognitive gap between "I'm designing" and "I'm rescuing an AI artifact."
- **Stepper transparency in Cleanup.** Each step showing Original → Transformed side-by-side is a trust-building choice. Users see what the tool did and can retreat without starting over.
- **Directional design-system anchors.** Sidebar widths, 8pt grid, `prefers-reduced-motion` call-out — enough to give Amelia a spine without over-prescribing tokens that belong in a separate doc.

---

## Gaps against the PRD (must-fix)

- **PX-003 (brand logo SVG export) has no UX surface.** The spec never shows where the user toggles SVG vs PNG when exporting an uploaded brand logo. Add to `/brand-kit` logo section or to the Export dialog schema.
- **PX-023 (Brand-Kit-tinted gallery thumbnails) is asserted but not shown.** The gallery mock shows generic thumbnails. Add an annotation: "thumbnails re-rendered with user's Brand Kit palette at fetch time" and show the first-paint state (is it user colors immediately, or default-then-swap?).
- **PX-024 (tag filters) — behavior on empty result.** Filters (Bold/Minimal/Festive/Corporate) are shown, but what happens when a filter returns 0 templates? No empty-state copy is specified.
- **PX-025 (one-click Resize for IG Story) — UI location unclear.** The spec mentions "Resize for..." in the editor top bar prose but doesn't place it in the wireframe. Where does the user tap? Is it a menu, a button, a right-click?
- **PX-053 (contrast-check preview before export) has no screen.** The PRD promises a light/dark/brand backdrop preview, but the Export dialog wireframe isn't drawn. This is a P2 but still needs a placeholder so Amelia can scaffold the DOM.
- **PX-062 (Brand Kit logos in Logo Creator sidebar).** The Logo Creator wireframe shows "Brand Kit ▾ [swatches]" but not a logos sub-section. Add it or the PRD story has no home.
- **JTBD 1 — "under 5 minutes" success scenario has no progress signal.** The PRD's success scenario is time-bounded, but no UI element helps the user feel "I'm moving fast." Consider a subtle step indicator on first-run (Hub → Gallery → Editor → Export, showing "3 clicks to publish").

---

## Missing UX states (empty, loading, error, success)

This is the biggest category of gaps. The spec shows the happy path beautifully but rarely the other 40% of the time users spend in these screens.

- **Hub empty state.** "Recent projects" — what shows when the user has zero projects? Needs an illustrated empty state or a gentle "Your recent work will appear here — pick a tile above to start."
- **Gallery loading state.** Template thumbnails are fetched + recolored per Brand Kit. At 20 thumbnails × network + render, there's a real perceived-latency gap. Spec needs skeleton tiles (WCAG-compliant shimmer, respecting `prefers-reduced-motion`).
- **Gallery error state.** `TemplateService.getThumbnail()` fails — what does the user see? Currently unspecified. Propose an inline retry affordance per-tile, not a full-page error.
- **Editor Brand Kit auto-apply — what if no Brand Kit exists yet?** The toast says "Applied your Brand Kit colors." If the user hasn't set one up, the toast should pivot to "Set up your Brand Kit to auto-apply on next template →" linking to `/brand-kit`.
- **Logo Cleanup per-step loading states.** Vectorize (<3s per NFR) and background removal both run real compute. No loading indicator is specified. Need progress bars or indeterminate spinners with descriptive copy ("Tracing paths… this takes ~2 seconds").
- **Logo Cleanup error states.** What happens if the uploaded image fails Pillow `verify()`? If `imagetracerjs` crashes on a corrupt SVG? Each step needs an error state with a human-readable cause and a "try a different file" CTA.
- **Export success feedback.** After clicking Export, what does the user see? A toast? A download-ready dialog? A "files saved to X" confirmation? The Export flow currently has no closing loop.
- **Brand Kit auto-apply — undo success feedback.** User clicks Undo → does the toast stay, flip to "Undone," or silently dismiss? Spec should pick one (recommend: flip to "Brand Kit removed — Re-apply?" for 3s, then dismiss).
- **Save state indicator.** The editor currently has no "saved" / "saving…" indicator called out. Given Priya's 5-minute budget, she must always know whether her work is persisted.

---

## Logo mode-chooser: necessary or friction?

**My call: necessary, but tighten the interaction.**

The mode-chooser earns its keep because the two downstream flows have genuinely different sidebars, inputs, and mental models. Collapsing them into a single logo editor with a "Mode: Create / Cleanup" toggle would force Priya to re-learn the UI each time she switched, and would create a right-sidebar identity crisis.

However — the current chooser screen adds a full page-load worth of friction for returning users who know which mode they want. Recommendations:

1. **Add a "remember my choice" per-user preference.** After 3 uses of the same mode, offer "Make this my default logo flow."
2. **Allow skip from the hub.** The hub Logo tile could expose a right-click / long-press / tile-expand affordance showing both modes as sub-tiles. Repeat users bypass the chooser; first-timers still see it.
3. **Resolve the escalation ask.** Orion flagged "should first-time users get a pre-selected default?" My recommendation: **no pre-selection** (the spec's current stance is correct). Forcing a deliberate first tap generates meaningful intent data and respects the user's autonomy on a decision that genuinely matters to them.

---

## Brand Kit auto-apply: does it feel safe?

**Mostly yes, with two additions needed.**

The 7-second Undo toast is a solid forgiveness primitive. But safety is about more than undo — it's about predictability. I'd add:

- **Pre-apply preview swatch strip.** Before applying, show a tiny "was → will be" color-pair strip in the toast itself, so the user sees the mapping and isn't surprised by a green-to-magenta jump.
- **Per-color manual override post-apply.** PRD PX-044 mentions per-color overrides in Cleanup; the same affordance should exist in the editor's Properties panel after Brand Kit applies to a template, not only in Cleanup. Currently the spec only implies the toast-level undo.
- **Never auto-apply to a user's finished work.** Clarify in the spec: Brand Kit auto-apply fires on *template load* only, never on edits to a project already in progress. Current spec is ambiguous.

---

## AI-Cleanup stepper skip-ability

**The intent is right; the execution in the wireframe shows it correctly for Step 3 (Vectorize) but not systematically.**

- The mock shows `[ Skip this step ]` on Step 3 only. Per PRD PX-046, every step should be skippable. Either show Skip on every step explicitly or add a note: "Every step has a Skip action — shown bottom-left on every stepper screen."
- Step 1 (Import) cannot be skipped — you need a file. Clarify that Skip is context-aware: it's disabled when the step's precondition isn't met.
- **Missing: what happens when you skip step 4 (Recolor)?** If the user skips, do they still land in the Logo Creator editor (step 5)? The flow diagram implies yes but the spec should say so.
- **Missing: a "back to previous step" state.** If a user is on Step 4 and realizes vectorize quality was wrong, do they Back-button to Step 3 with state preserved, or does it start over? Critical trust question.

---

## Accessibility concerns

The spec mentions WCAG AA (PRD §5, §6) and calls out `aria-label` on hub tiles, `aria-current="step"` on the stepper, and `prefers-reduced-motion`. Good start, but **insufficient detail for an AA claim.**

Gaps:

- **Keyboard nav flow is not specified across screens.** What's the tab order on the hub? The gallery? The Logo Creator three-panel layout? Without this, implementers will invent it and we'll get regressions. Add a Tab order diagram per screen.
- **Focus visible styles are asserted ("Focus visible") but not tokenized.** Specify outline color, width, offset — consistent with existing Angular Material theme.
- **`aria-label` mentioned on hub tiles, missing on:**
  - Gallery filter chips
  - Template thumbnails (needs descriptive label: "Bold IG Post template — blue and orange palette")
  - Logo Creator shape library items (screen readers currently announce nothing meaningful for "○ ● □")
  - Stepper step indicators (need `aria-label="Step 3 of 6: Vectorize, current step"`)
  - Canvas size indicator dropdown in the editor top bar
- **Screen-reader announcements for async events.** Brand Kit auto-apply toast, Vectorize completion, Export-ready — all should fire `aria-live="polite"` announcements. Not specified.
- **Color-contrast for the platform-branded tile fills.** Spec says "solid fill matching platform brand color at 12% opacity." That's fine for background, but label text *on* that fill must still pass 4.5:1 — needs an `AccessibilityService` assertion in the hub implementation notes, not just a sentence.
- **Contrast-check preview (PX-053)** is mentioned but the preview needs to state the measured ratio, not just show a visual mock. "4.6:1 ✓ AA" vs "2.1:1 ✗" with descriptive copy for screen-reader users.
- **Stepper keyboard nav.** "Tab + Enter advances" — but what about Shift+Tab to go back, Esc to exit, arrow keys to jump between steps? Specify.
- **Reduced-motion contract.** Spec says "respect `prefers-reduced-motion`." List specifically what changes: toast slide-in → fade, canvas transitions → instant, skeleton shimmer → solid block.
- **Text resize.** No mention of how the editor behaves at 200% browser zoom (WCAG 1.4.4). The three-panel layout will break without intervention.

---

## Suggested improvements

- **Add a Section 12: "State Inventory"** — a table listing every screen × state (default / loading / empty / error / success) with the copy and interaction for each. This alone closes ~70% of the gaps above.
- **Add a Section 13: "Accessibility Checklist"** — per-screen, tied to WCAG 2.1 AA criteria (1.4.3 contrast, 2.1.1 keyboard, 2.4.3 focus order, 4.1.3 status messages). Paige is the right reviewer for this.
- **Hub tile iconography consistency.** Currently mixed emoji (🟪 📱 💼 ▶️ ✨). Commit to either custom SVG glyphs or a specific emoji family; emoji rendering varies wildly across OSes and hurts brand coherence.
- **Gallery filter chips need an "All" default state indicator.** Show which filter is active (underline, pill-fill, checkmark). Currently all four chips look identical.
- **Editor: Brand Kit toast copy.** "Applied your Brand Kit colors to this template. Undo?" — the "?" feels like a question rather than a button label. Propose: "Applied your Brand Kit. [Undo]" with Undo as a visually distinct button inside the toast.
- **Logo mode-chooser copy.** "Clean up an AI logo" is clear but "Start from scratch" is ambiguous (from-scratch-what?). Suggest "Design a logo from shapes and text."
- **Cleanup stepper — rename Step 5.** "Edit" is too generic. Call it "Refine" or "Polish" to signal this is discretionary polish, not mandatory editing.
- **Add a "What is this?" tooltip pattern** for first-time users on each stepper step — small "ⓘ" icon, keyboard-accessible, WCAG 3.3.5 compliant.
- **Recent Projects affordance.** A dropdown "▾" on the hub is hiding a primary re-entry point. For return users, this is their most common action. Consider inline horizontal scroll, not a collapse.
- **Responsive breakpoint for the Logo Creator three-panel layout.** Sidebar (shape library) + canvas + properties = ~800px minimum before it feels cramped. Spec should call out the tablet/mobile collapse behavior (drawer? tabs? banish mobile?).
- **Loading skeleton visual style.** Define once in §9 Mini Design System so every skeleton across the app looks the same.

---

## Closing note

The bones here are honest and the principles are load-bearing. The work now is to fill in the quiet moments — the waiting, the failing, the empty-first-use, the screen-reader path — because those are the moments where Priya decides whether this tool respects her time. I'm happy to pair with Amelia on the State Inventory table and with Paige on the Accessibility Checklist before the next review cycle.

— Sally
