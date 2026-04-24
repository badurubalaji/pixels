# Winston review — ARD

**Reviewer:** Winston (System Architect)
**Date:** 2026-04-23
**Artifact under review:** `_bmad-output/planning-artifacts/architecture/ard-mvp.md`
**Cross-referenced:** `_bmad-output/planning-artifacts/prd/mvp-prd.md`, `docs/project-context.md`

---

## Verdict

**APPROVE WITH CHANGES**

The ARD is directionally sound and honors the "existing code beats new code" principle well. The 3-flow logo decomposition is the right shape. However, there are four concrete gaps that must be closed before the first implementation story lands — all of them cheap to fix, none of them forces a re-design. None rise to "request revisions," but they are not optional either.

---

## Architecturally sound

- **God-node reuse is enforced.** §1 binds extensions through `CanvasService`, `Editor`, `ApiService`, `ProjectService`, `ExportService`. The Graphify baseline (946 nodes / 1596 edges / 36 communities, captured 2026-04-23) is named as the reference. Good — that keeps drift visible.
- **Editor-converges / flows-diverge** (§4.2, §5) is the right decomposition. One `app-editor-shell` hosting `fabric.js`, with `LogoCreatorComponent` / `LogoCleanupComponent` / `TemplateEditorComponent` as thin sidebar-plus-shell wrappers, is exactly the shape the god-node graph predicts. This is NOT a boundary leak — the three flows differ only in entry-state hydration and side panels. Trying to factor further (e.g., a `LogoEditorBaseComponent`) would be premature abstraction.
- **Client-heavy default** (§1.4) is the right call for a self-hosted personal tool. Zero incremental server cost, works offline post-load, keeps the Docker Compose footprint small. The carve-out for rembg + heavy AI is correct.
- **Lazy-loading the three new deps** (§7) via dynamic `import()` on the cleanup/export paths keeps the main bundle under the 500KB gzipped budget. Good discipline.
- **Template storage via MongoDB JSON blobs, no S3** (§3.3) is defensible at <1000 templates. BSON documents cap at 16MB; a fabric.js scene with thumbnail data-URL lands in the 100–500KB range, so ~1000 templates = ~500MB of Mongo which is fine. The "revisit at >1000 or multi-tenant" trigger is explicit — that's the architecturally responsible framing.
- **Project-context §5.1 bug call-out** (ARD §6, PX-002) — catching the `get_db()` inferred-path violation and scheduling the fix before new features touch those routers is exactly right.
- **Performance budgets (§9) are largely realistic.** Hub <500ms TTI on fast 3G is aggressive but achievable with the Angular 21 new control flow + standalone components + lazy-routes already in the stack. Editor open <1500ms is fine. Main bundle <500KB gzipped is tight but plausible given the lazy-load strategy.

---

## Concerns (must-fix before implementation)

### C1. SVG XSS is the biggest unaddressed threat surface in MVP

§12 mentions "Reject SVG with `<script>` tags — use `DOMPurify` on import (new dep needed? … verify during PX-040)." This is too casual.

- The logo cleanup flow (PX-040) **accepts user-uploaded SVG** and **renders it inside fabric.js**, which ultimately lands in the DOM.
- Angular's `DomSanitizer` sanitizes `[innerHTML]` bindings but **does not** sanitize content passed to fabric.js, which uses `fabric.loadSVGFromString` internally and can instantiate `<image>`, `<foreignObject>`, and event-handler attributes that Angular never sees.
- SVG XSS vectors beyond `<script>`: `onload=`, `onclick=`, `<foreignObject>` with HTML, `<use xlink:href="data:...">`, `javascript:` URIs in `<a href>`.

**Required before PX-040 ships:**
1. Commit to DOMPurify (or a vetted equivalent) as a **fourth** new dep. It is not an optional checklist item — it is the sanitizer between untrusted SVG and the editor DOM. ~20KB gzipped, MIT, maintained.
2. Sanitize with `DOMPurify.sanitize(svgString, { USE_PROFILES: { svg: true, svgFilters: true } })` **before** `fabric.loadSVGFromString`.
3. Add a server-side defense-in-depth check in `asset_routes.py` that rejects SVGs containing `<script`, `on*=`, `javascript:`, `<foreignObject`, or external `href` — the simple regex/parser check, not a replacement for client sanitization.

### C2. Data model has no migration plan for existing pre-MVP projects

§8.3 adds `platform` and `source_template_id` to the `projects` collection but says nothing about existing documents that pre-date these fields.

- Projects created before MVP have neither field. Any query filtering `{ platform: "ig-post" }` silently drops them. Any code reading `project.platform` without a default will throw or render "undefined" in the UI.
- This violates the project-context.md §5.1 escalation policy — **schema migrations require explicit human approval**. The ARD treats them as implicit.

**Required before data-model changes land:**
1. Add §8.4 "Backward compatibility & migration":
   - Pydantic response models must make `platform: str | None = None` and `source_template_id: str | None = None`.
   - Ship a one-shot idempotent migration script `backend/scripts/migrate_projects_mvp.py` that: for each project missing `platform`, infer from `canvas_json.width/height` via a reverse-lookup against `PlatformPresetService` (falling back to `"custom"`). Logs the count migrated. Run manually on first deploy, not at app startup.
   - Document in ARD that `source_template_id` defaults to `null` for existing projects — no inference attempted.
2. Escalate the schema migration to the user per §5.1 before PX-023 / PX-060 ship. Right now this is buried in Escalation #3, which is about deployment not data-model.

### C3. Observability story is weaker than the budgets it needs to defend

§11 is three lines: "console.error → Sentry hook (defer actual Sentry)", "structured logging via stdlib logging", "Graphify post-merge." That is not enough to know whether the §9 performance budgets are actually being met in production.

- If Hub TTI regresses from 500ms → 1500ms, who notices? Today: nobody.
- If vectorize client-side crosses 3s for 40% of real user PNGs, who notices? Today: nobody.
- "Defer Sentry" is reasonable for error-reporting SaaS, but that's not an excuse to defer *measurement*.

**Required additions to §11 (none of these need new deps):**
1. **Client perf marks** via `performance.mark()` + `performance.measure()` around the four budgeted surfaces (hub TTI, editor-open, vectorize, bg-removal). A dev-mode banner that surfaces the current-session measurements. Five lines of code per surface.
2. **Backend request timing** logged per request via FastAPI middleware (existing `logging` infra, just a `time.perf_counter()` wrap). Logs the route + duration in the structured JSON line already committed to.
3. **Error sink** — a local-only endpoint `POST /api/v1/telemetry/error` that eats `console.error` payloads and writes them to a rolling log file. One-day ticket. Gives a concrete migration path to Sentry/Glitchtip in v1 without guessing the payload shape.
4. **Define "what we are blind to"** explicitly. E.g., "no RUM, no distributed tracing, no APM — we accept this risk for self-hosted scale." That's the defensible posture; the ARD should state it rather than imply it.

### C4. CSRF and SSRF are not addressed at all

- **CSRF:** With JWT in `Authorization` headers (not cookies), CSRF is *largely* mitigated. But §12 doesn't say that — it should. If at any point the frontend falls back to cookie-stored tokens (e.g., for a refresh flow), CSRF becomes live again. One sentence in §12: "CSRF not applicable — all auth via `Authorization: Bearer` headers; refresh tokens never travel as cookies."
- **SSRF:** The asset pipeline accepts URLs indirectly if any "import from URL" feature exists now or lands in MVP. PX-040 says "drop a PNG/JPG/WebP/SVG" — if that is drag-drop *file* only, SSRF is not a risk. Confirm and document. If it includes URL paste, we need a strict allow-list + no localhost/private-IP fetches.

---

## Dependency-choice concerns

### `imagetracerjs` — LGTM, with a caveat

- MIT, ~60KB gzipped, pure JS, well-suited to MVP vectorization quality. Right choice over `vtracer` (which is Rust/WASM with a larger runtime footprint and server-side deployment complexity).
- **Caveat:** imagetracerjs is in maintenance mode — last meaningful release ~3 years ago. For MVP this is fine (the algorithm is stable), but the ARD should acknowledge it and lock the version in `package.json`. Plan a v1 re-evaluation vs. `@napi-rs/image` or `vtracer-wasm`.
- Lower-risk alternative considered but rejected correctly: `potrace` (JS port) is monochrome only — doesn't fit colored logo use case.

### `svgo` — LGTM, but the bundle claim needs verification

- ~300KB "dev-dep or client bundle" — the PRD says "dev-dep or client bundle lazy-loaded." Important: svgo's **browser build** pulls in CSSO and a bunch of plugins. Real client-side bundle cost after tree-shaking is closer to **400–500KB gzipped**, not 300.
- For a personal-use cleanup flow this is acceptable when lazy-loaded. But verify the actual browser-bundle size during PX-043 and write it into the ADR. If it blows past 500KB gzipped, consider running SVGO server-side as a `asset_routes.py` endpoint — offloads the bundle cost and is trivial to implement (it's a Python-callable Node subprocess, or `scour`/`svgelements` Python-native).

### `png-to-ico` — LGTM but consider the fallback ordering

- MIT, small, pure JS. Right choice for client-side.
- §3.4 says "Fallback to Pillow `ImageDraw` server-side if client path fails." Nitpick: ICO generation is `PIL.Image.save(..., format='ICO', sizes=[...])`, not `ImageDraw`. Fix the wording — a dev reading this will chase the wrong API.
- Consider: Pillow can do ICO natively and handles alpha correctly. Given that `rembg` already imports Pillow server-side, the **simpler MVP** might be to skip `png-to-ico` entirely and do ICO server-side from day one. One less dep, one less front-end bundle cost. Personal tool — the 200ms server round-trip doesn't matter.

### DOMPurify — missing from the list

Per C1 above, this is the fourth new dep and should be promoted from "verify during PX-040" to the §7 table with explicit approval.

---

## Migration / backward-compat issues

See C2 above for the primary issue. Additional smaller items:

- **`brand_kits.logos` array** (§8.2) — added as a new field. Existing brand_kits docs won't have it; Pydantic model must default to `[]`. Verify the existing `brand_schemas.py` Pydantic v2 model before PX-062.
- **`templates.palette_slots`** (§8.1) — seed data only per the ARD, so no migration of existing user data. But if a user has already created "templates" via a pre-MVP path (check `templates` collection in live Mongo before seeding), the seed script must be idempotent *and* not clobber user-created template records. Seed script in `backend/app/seed/templates_seed.py` needs a unique index on `name + is_seed: true` to make re-seeds safe.
- **Projects' `thumbnail_data_url`** — already existed pre-MVP per ARD implication. Confirm. If it's new, that's another field to default-null in the response model.

---

## Suggested simplifications

1. **Drop `png-to-ico`, do ICO server-side** (see dep note above). Net effect: one fewer client dep, one fewer lazy-load boundary, ICO export becomes a simple `POST /api/v1/export/ico` with the already-trusted Pillow pipeline. The PRD's own §9 risk table already flags "ICO requires server-side helper if client-only approach fails" — so we'd save ourselves the fallback branch.

2. **Collapse `BrandKitColorMapper` and `VectorizeService` import graph concerns.** Both are client-side, both operate on SVG strings. Consider a single `core/services/svg/` namespace with `vectorize.ts`, `color-map.ts`, `sanitize.ts` (new, per C1), `optimize.ts` (svgo wrapper). Keeps the logo pipeline's surface area in one place and makes it testable as a whole. Not a re-architecture — just file organization.

3. **The platform-preset centralization** (ARD §3.4, Story PX-020) should be a single source of truth consumed by BOTH frontend (`src/app/core/constants/platform-presets.ts`) AND backend (for the `platform` validator on `projects` and `templates`). Either ship a shared JSON file read by both, or duplicate with a comment and a linter rule. Otherwise the next dev adds "YouTube Short" to the frontend and Mongo rejects the write. Cheap to fix now, painful later.

4. **Observability — resist defer Glitchtip entirely.** A running `glitchtip` container in Docker Compose is ~200MB RAM and zero config. If the infra is already Docker Compose, the marginal cost is near-zero and you get actual error telemetry from day one. Reconsider vs. "defer to v1."

5. **Delete the "might already be in Angular sanitizer pipeline; verify during PX-040"** hedge in §12. Either we know by the time the ARD merges or we don't merge. Architectural documents should not carry "figure it out later" on security-critical items. (This ties to C1.)

---

## Summary tie-back to review criteria

| Criterion | Finding |
|---|---|
| Honors "existing code beats new code" | ✅ Yes — god-nodes reused, only seed + routes extended |
| Three new deps are right choice | ⚠️ Two (imagetracerjs, svgo) yes; png-to-ico should be replaced with server-side Pillow; DOMPurify missing |
| 3-flow logo decomp clean | ✅ Yes — entry diverges, editor converges |
| Template storage defensible at <1000 | ✅ Yes with the documented revisit trigger |
| Perf budget reality | ✅ Mostly — svgo browser bundle needs verification |
| Security adequate | ❌ SVG XSS under-specified, CSRF/SSRF unstated — see C1 & C4 |
| Data model migration plan | ❌ Missing — see C2 |
| Observability beyond `console.error` | ❌ Weak — see C3 |

Fix C1–C4 and the three dep-table/simplification items, and this is a clean approve.
