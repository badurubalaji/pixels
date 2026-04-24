# Story PX-003 — Brand Kit SVG logo export

**Epic:** A — Foundation Hardening
**Sprint:** 1
**Size:** S
**Priority:** P1
**Owner:** Amelia
**Status:** Ready for dev
**Depends on:** PX-001

---

## Context

The existing `BrandKitService` (`src/app/core/services/brand-kit.service.ts`) lets users upload brand logos, but the current export path only produces PNG/JPG. A logo in PNG loses fidelity at large sizes (print, high-DPI displays) and lacks transparency flexibility.

`fabric.js` 7 has native `.toSVG()` on canvas. `ExportService` already has the export plumbing. This story wires the two together behind a visible UI affordance in Brand Kit → Logos.

---

## Acceptance Criteria

- **AC-1** — In `BrandKitService`, when a user uploads a brand logo that is already an SVG, it is stored as SVG and served back as SVG unchanged.
- **AC-2** — When a user uploads a PNG/JPG/WebP brand logo, a new "Export as SVG" action is **unavailable** (raster → SVG conversion is out of scope here; that's PX-042 in Logo AI-Cleanup).
- **AC-3** — A brand logo stored as SVG can be downloaded by the user in its native SVG form via a new "Download SVG" button on the Brand Kit Logo card.
- **AC-4** — A brand logo stored as SVG can be placed on the editor canvas and exported as a PNG at any resolution via the existing `ExportService`.
- **AC-5** — Vitest tests cover: SVG upload path, SVG download path, SVG-on-canvas → PNG export path.
- **AC-6** — Backend accepts `image/svg+xml` MIME type in `asset_routes.py` upload endpoint (verify current MIME whitelist; add if missing).
- **AC-7** — SVG upload is sanitized via **`dompurify`** (committed dep per ARD §7 revision-wave-1 — Angular's built-in sanitizer does not cover all SVG XSS vectors). No `<script>`, `<foreignObject>`, `on*` attributes, or external `xlink:href` survive to the stored file. Backend re-parses with `defusedxml.lxml` as defense-in-depth.
- **AC-8** — `CanvasService.addSvg(svgString: string): Promise<fabric.Object>` is added as a definite new public method on `CanvasService`, wrapping `fabric.loadSVGFromString` with Promise semantics. Unit-tested. (Previously conditional in this story; revision-wave-1 makes it definite.)

## Tasks / Subtasks

- [ ] **T-1 · Verify existing SVG upload support**
  - [ ] Check `asset_routes.py` MIME allowlist. If `image/svg+xml` missing, add it.
  - [ ] Check `BrandKitService.addBrandLogo()` implementation — verify it preserves original content for SVG.
- [ ] **T-2 · Add SVG sanitization on upload**
  - [ ] Frontend: install `dompurify` (committed dep per ARD §7; approval recorded in orchestrator-log 2026-04-24T00:03Z). `npm install dompurify @types/dompurify`.
  - [ ] Use `DOMPurify.sanitize(svgString, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ['script', 'foreignObject'], FORBID_ATTR: ['onload', 'onerror', 'onclick'] })`.
  - [ ] Backend: add `defusedxml` to `requirements.txt`. Re-parse with `defusedxml.lxml`; reject if `<script>` present or if any `xlink:href` points to an external URL (defense in depth).
- [ ] **T-3 · Add Download SVG button**
  - [ ] Extend the Brand Kit Logos UI (`src/app/features/brand-kit/components/logos-panel.ts` — **verify path**) with a "Download SVG" action visible only for SVG logos.
  - [ ] Use `Blob` + `URL.createObjectURL` + `<a download>` pattern.
- [ ] **T-4 · SVG-on-canvas flow**
  - [ ] Confirm `CanvasService` can drop an SVG onto canvas (likely already works via fabric.loadSVGFromString).
  - [ ] If missing, add `addSvg(svg: string): Promise<void>` method.
- [ ] **T-5 · Tests**
  - [ ] Unit tests for sanitization (malicious SVG fixtures).
  - [ ] Unit tests for download path.
  - [ ] Integration test: upload SVG → place on canvas → export PNG → assert PNG non-empty.
- [ ] **T-6 · Docstrings**
  - [ ] TSDoc on every new/changed public method.

## File List (expected)

| Path | Change |
|---|---|
| `pixelforge/src/app/core/services/brand-kit.service.ts` | modified (add SVG support if missing) |
| `pixelforge/src/app/core/services/brand-kit.service.spec.ts` | new or modified |
| `pixelforge/src/app/features/brand-kit/components/logos-panel.ts` | modified |
| `pixelforge/src/app/core/services/canvas.service.ts` | modified (addSvg helper if needed) |
| `pixelforge/src/app/core/services/canvas.service.spec.ts` | modified |
| `pixelforge/backend/app/asset_routes.py` | modified (MIME allowlist) |
| `pixelforge/backend/tests/test_asset_routes.py` | modified or new (SVG upload) |
| `pixelforge/package.json` | modified (add `dompurify`, `@types/dompurify`) |
| `pixelforge/backend/requirements.txt` | modified (add `defusedxml`) |

## Dev Agent Record

_(Amelia fills.)_

## Definition of Done

- [ ] All ACs met.
- [ ] Tests green.
- [ ] Docs complete.
- [ ] File List matches diff.
- [ ] If DOMPurify adds a dep, Orion approval confirmed in PR description.
