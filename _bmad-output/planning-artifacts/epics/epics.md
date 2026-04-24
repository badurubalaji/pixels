# Pixels MVP — Epics

**Author:** Orion (Orchestrator) with inputs from John + Winston
**Date:** 2026-04-24
**Depends on:** `../prd/mvp-prd.md`, `../architecture/ard-mvp.md`
**Status:** Draft for review

---

## Overview

The MVP maps to 7 epics across 3 sprints (~6 weeks total). Epic A is infrastructure and must complete before B/C can safely proceed. D/E/F/G can run partially in parallel once A+B+C are unblocked.

| Epic | Title | Stories | Sprint | Owner | Depends on |
|------|-------|---------|--------|-------|------------|
| A | Foundation Hardening | PX-001, PX-002, PX-003 | 1 | Amelia | — |
| B | Content Hub & Navigation | PX-010, PX-011, PX-012 | 1 | Amelia (Sally UX) | A |
| C | Platform Size Presets & Template Gallery | PX-020, PX-021, PX-022, PX-023, PX-024, PX-025 | 1–2 | Amelia | A, B |
| G | Brand Kit Integration | PX-060, PX-061, PX-062 | 2 | Amelia | C |
| F | Multi-Format Export | PX-050, PX-051, PX-052, PX-053 | 2 | Amelia (Winston arch) | A |
| D | Logo Creator Mode | PX-030, PX-031, PX-032, PX-033 | 2–3 | Amelia (Sally UX) | A, F |
| E | Logo AI-Cleanup Mode | PX-040, PX-041, PX-042, PX-043, PX-044, PX-045, PX-046 | 3 | Amelia (Winston pipeline) | D, F |

---

## Sprint allocation (proposal, revocable)

### Sprint 1 (weeks 1-2) — FOUNDATION + HUB

**Goal:** test baseline green, hub live, platform presets working, user can navigate.

- Epic A · PX-001 · CanvasService + Editor test baseline
- Epic A · PX-002 · `get_db()` Depends refactor across 4 route files
- Epic A · PX-003 · Brand Kit SVG logo export
- Epic B · PX-010 · Build `/hub` with 6 tiles
- Epic B · PX-011 · Make hub the default post-login route
- Epic B · PX-012 · Tile routing to `/gallery/:type`
- Epic C · PX-020 · Audit + extend platform size presets
- Epic C · PX-021 · Editor opens with correct preset from hub flow
- Epic C · PX-022 · Seed 20 starter templates

**Definition of Done (Sprint 1):** User can land on `/hub`, pick a platform, browse templates, and open a template in the editor at the correct size. Backend test directory exists, god-nodes have >60% coverage, `get_db()` inconsistency gone.

### Sprint 2 (weeks 3-4) — GALLERY EXPERIENCE + LOGO CREATOR + EXPORT

- Epic C · PX-023 · Gallery thumbnails pre-rendered with Brand Kit
- Epic C · PX-024 · Filter by tags (P2 — can slip)
- Epic G · PX-060 · Brand Kit auto-apply + toast on template load
- Epic G · PX-061 · Brand Kit fonts as defaults
- Epic G · PX-062 · Brand Kit logos in sidebar
- Epic F · PX-050 · SVG export
- Epic F · PX-051 · Transparent PNG multi-size
- Epic F · PX-052 · ICO multi-size export
- Epic D · PX-030 · Logo mode chooser
- Epic D · PX-031 · Shape library (30 primitives)
- Epic D · PX-032 · Typography pairings
- Epic D · PX-033 · Brand Kit swatches in Logo Creator

**Definition of Done (Sprint 2):** User can create a logo from scratch and export SVG/PNG/ICO. Templates feel personalized via Brand Kit colors.

### Sprint 3 (weeks 5-6) — LOGO AI-CLEANUP + POLISH

- Epic E · PX-040 · Import file (PNG/JPG/WebP/SVG)
- Epic E · PX-041 · BG-remove integration
- Epic E · PX-042 · Vectorize via `imagetracerjs`
- Epic E · PX-043 · SVG optimize via `svgo`
- Epic E · PX-044 · Snap-to-Brand-Kit recolor
- Epic E · PX-045 · Handoff to editor for refinement
- Epic E · PX-046 · Skip-any-step UX
- Epic C · PX-025 · One-click "Resize for IG Story" from IG Post (P2 — can slip to v1)
- Epic F · PX-053 · Contrast-check preview (P2)

**Definition of Done (Sprint 3 = MVP Ship):** All P0 stories green, success-scenario demonstrable end-to-end, 0 regressions, documented.

---

## Cross-epic dependencies graph (quick-read)

```
A (Foundation)
│
├─▶ B (Hub)
│    │
│    ▼
├─▶ C (Presets + Templates) ──▶ G (Brand Kit integration)
│                                  │
├─▶ F (Export: SVG, PNG multi, ICO)│
│    │                             │
│    ▼                             │
├─▶ D (Logo Creator) ◀─────────────┘
│    │
│    ▼
└─▶ E (Logo AI-Cleanup)
```

---

## Non-MVP (v1+)

Stories explicitly deferred from this MVP for tracking:

- PX-034 — SVG boolean ops (Logo Creator)
- "Resize for" with smart reflow across all platform pairs (PX-025 starts it; full matrix is v1)
- Server-side `vtracer` for higher-quality logo vectorization
- AI text-generation inside templates (Canva Magic Write analog) — magic-write.service.ts already exists; extend in v1
- Stock photo library integration (Unsplash / Pexels)
- Multi-user real-time collaboration
- Template marketplace / public sharing
- Mobile-native app
- Video editor
- Doc/docx/pdf editor
- Whiteboards, presentations, websites

---

## Reviewer sign-off

| Reviewer | Role | Status |
|---|---|---|
| Orion | Self | ✅ |
| John | PRD trace | ⏳ pending |
| Winston | Arch trace | ⏳ pending |
| Amelia | Sprint-1 executability | ⏳ pending |
