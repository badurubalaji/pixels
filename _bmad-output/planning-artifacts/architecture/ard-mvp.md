# Pixels MVP — Architecture Design Record (ARD)

**Author:** Winston (System Architect), dispatched by Orion
**Date:** 2026-04-24
**Status:** Draft for review
**Depends on:** `../vision/north-star-vision.md`, `../prd/mvp-prd.md`, `../ux-spec/ux-wireframe-spec.md`
**Graphify baseline:** `pixelforge/graphify-out/graph.json` (946 nodes, 1596 edges, 36 meaningful communities, captured 2026-04-23)

---

## 1. Guiding architectural principles (binding)

1. **Existing code beats new code.** The 946-node graph already exposes god-nodes `CanvasService`, `Editor`, `ApiService`, `ProjectService`, `ExportService`. Extensions go through these; no parallel re-implementations.
2. **Self-hosted boring technology.** Every component must be operable on a single Docker Compose stack. No SaaS dependencies.
3. **One editor, multiple entry flows.** The logo Creator mode, logo AI-Cleanup mode, and template editor all converge on the same `fabric.js` canvas — differences live in entry flow and side panels only.
4. **Client-heavy by default.** Push compute to the browser unless it's prohibitively expensive (server-side only for rembg, heavy-image tasks, and AI inference). Reason: zero incremental server cost, works offline post-load, keeps self-hosted footprint small.
5. **Stay inside the BMAD flow.** No story lands without design → arch → story → test → doc.

---

## 2. System context (MVP)

```
  ┌─────────────────────────────────────────────────────────┐
  │                  Browser (Angular 21)                   │
  │                                                         │
  │  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐    │
  │  │   Hub   │→ │   Gallery   │→ │     Editor       │    │
  │  └─────────┘  └─────────────┘  │  (fabric.js,     │    │
  │                                │  signals, zoneless)    │
  │  ┌─────────────────┐           │                  │    │
  │  │ Logo mode       │           │  CanvasService   │    │
  │  │ chooser         │──────────▶│  ExportService   │    │
  │  │ (Creator /      │           │  BrandKitService │    │
  │  │  AI-Cleanup)    │           │  (existing)      │    │
  │  └─────────────────┘           └──────────────────┘    │
  │         │                                               │
  │         ▼                                               │
  │  ┌─────────────────┐                                    │
  │  │ VectorizeService│ ← imagetracerjs + svgo (new)       │
  │  └─────────────────┘                                    │
  │                                                         │
  │  ┌─────────────────┐                                    │
  │  │ ApiService      │ ─── HTTP / JWT ───┐                │
  │  └─────────────────┘                   │                │
  └────────────────────────────────────────┼────────────────┘
                                           │
                                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │              FastAPI backend (Python 3.11+)             │
  │                                                         │
  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
  │  │ auth_routes  │  │ project_routes│  │ template_   │  │
  │  │              │  │               │  │ routes      │  │
  │  └──────────────┘  └───────────────┘  └─────────────┘  │
  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
  │  │ asset_routes │  │ brand_routes  │  │ comments_   │  │
  │  │              │  │               │  │ routes      │  │
  │  └──────────────┘  └───────────────┘  └─────────────┘  │
  │                                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  database.py  (motor / MongoDB, async)           │  │
  │  │  get_db()  — consumed via Depends() only         │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  rembg + Pillow + ONNX runtime (CPU)             │  │
  │  │  served via bg-removal endpoints (existing)      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                         │
  │  backend/uploads/   (filesystem asset store — MVP)      │
  └─────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                             ┌───────────────────────────┐
                             │   MongoDB (motor async)   │
                             │   collections:            │
                             │     users                 │
                             │     projects              │
                             │     templates      (seed) │
                             │     brand_kits            │
                             │     assets                │
                             │     comments              │
                             └───────────────────────────┘
```

---

## 3. Shared-foundation layers

### 3.1 Auth
- Existing JWT flow via `auth_routes.py` + `auth.interceptor.ts` (functional interceptor per Angular 21 standards).
- Access TTL ≤ 15 min, refresh token rotation, token version per user (project-context.md §5.3).
- **No change required for MVP.**

### 3.2 Asset pipeline
- Upload flow: client → `POST /api/v1/assets` → FastAPI validates MIME + size + `Pillow.verify()` → stores under `backend/uploads/<user_id>/<uuid>.<ext>` → returns asset record to Mongo.
- Content types allowed MVP: image/png, image/jpeg, image/webp, image/svg+xml.
- **Virus scan & EXIF-strip** are v1+ additions; MVP relies on trusted self-hosted context.
- Served back via `GET /api/v1/assets/{asset_id}` (existing route). CDN deferred.

### 3.3 Project / Template storage
- `projects` collection: one document per user project. Stores canvas JSON (from `fabric.js.toJSON()`), platform preset, thumbnail data-URL, owner, timestamps.
- `templates` collection: seed data. Same shape as a project but with `is_template: true`, `tags: [...]`, `platform: "ig-post" | "ig-story" | ...`, and `palette_slots` array naming which fills should be mapped to Brand Kit colors on instantiation.
- **No S3 or object-store added.** Revisit at >1000 templates or multi-tenant.

### 3.4 Export pipeline
- Existing `ExportService` already handles PNG / JPG / PDF export.
- MVP additions:
  - **SVG** via `fabric.js.toSVG()` → blob → download. Trivial.
  - **Transparent PNG multi-size** via loop over `canvas.toDataURL('image/png')` at different pixel ratios.
  - **ICO multi-size** via `png-to-ico` (new dep, MIT). Client-side. Fallback to Pillow `ImageDraw` server-side if client path fails.
- Platform-size presets centralized in `src/app/core/constants/platform-presets.ts` — audited + expanded in Story PX-020.

### 3.5 Collaboration / Comments
- Existing `CommentsOverlay` + `collab_routes.py` + `CollaborationService` stay as-is.
- No multi-user cursor / real-time edits in MVP.

---

## 4. Editor engine (fabric.js + Angular 21)

### 4.1 Why fabric.js
- Already a dependency (`fabric ^7.2.0`).
- Handles vector shapes, text, raster images, and SVG-in / SVG-out natively.
- Supports all MVP needs (logo creator, template editor, photo editing overlay).

### 4.2 Editor shell
- Single `<app-editor-shell>` component hosting the canvas.
- Thin wrappers for different entry modes:
  - `LogoCreatorComponent` — Creator sidebar + editor shell
  - `LogoCleanupComponent` — Cleanup stepper + editor shell
  - `TemplateEditorComponent` (existing) — template sidebar + editor shell
- Entry flows hydrate the canvas with different initial state. Core editor logic stays in `CanvasService`.

### 4.3 Signals + zoneless
- All new components use signals per project-context.md §4.1.
- State flows: platform preset → `signal()`. Brand Kit snapshot → `signal()`. Canvas dirty → `computed(() => ...)`.
- No `BehaviorSubject` in new code.

---

## 5. Logo — three-flow architecture

```
  /logo/mode-chooser
          │
   ┌──────┴──────┐
   │             │
   ▼             ▼
Create        Clean-up
   │             │
   │    ┌────────┴──────┐
   │    │   Import      │
   │    │   file?       │
   │    │  PNG/JPG?     │
   │    │               │
   │    ▼               ▼
   │  Raster          SVG
   │    │               │
   │    │               │
   │    ▼               │
   │  BG-Remove         │
   │  (existing)        │
   │    │               │
   │    ▼               │
   │  Vectorize         │
   │  (imagetracerjs)   │
   │    │               │
   │    ▼               │
   │  SVGO optimize     │
   │    │               │
   │    ▼               │
   │  Recolor-to-Brand  │
   │    │               │
   │    └───────┬───────┘
   │            │
   └────────────▶ Editor shell (fabric.js) ──▶ Export pipeline
                       │
                       └─▶ Save as project
```

**Key architectural choices:**
- The **entry flows diverge**; the **editor converges**.
- Vectorize is client-side (`imagetracerjs`). No server-side trace in MVP.
- Recolor-to-Brand is pure DOM walk over the SVG fill/stroke tree → nearest-Brand-Kit-color (Euclidean RGB distance is fine for MVP). Pure logic, zero deps.
- The entire cleanup stepper state lives in a single signal-based state machine (`LogoCleanupState`).

---

## 6. New services & modules

### Frontend

| Service / component | Location | Scope |
|---|---|---|
| `VectorizeService` | `src/app/core/services/vectorize.service.ts` | Wraps `imagetracerjs` + `svgo`. Exposes `vectorize(png: Blob, quality: 0–1): Promise<SVGString>`. Lazy-loaded deps via `import('imagetracerjs')` to keep main bundle small. |
| `BrandKitColorMapper` | `src/app/core/services/brand-kit-color-mapper.service.ts` | Walks an SVG tree, maps every fill/stroke to nearest Brand Kit color (with override overrides). |
| `PlatformPresetService` | `src/app/core/services/platform-preset.service.ts` | Canonical list of platform sizes + lookup by type. |
| `HubComponent` | `src/app/features/hub/hub.component.ts` | 6-tile hub landing. |
| `GalleryComponent` | `src/app/features/hub/gallery.component.ts` | Per-type template gallery. |
| `LogoModeChooserComponent` | `src/app/features/logo/mode-chooser.component.ts` | Two-card chooser. |
| `LogoCreatorComponent` | `src/app/features/logo/create/logo-creator.component.ts` | Creator editor shell. |
| `LogoCleanupComponent` | `src/app/features/logo/cleanup/logo-cleanup.component.ts` | Stepper + editor shell. |

### Backend

| Module | Location | Scope |
|---|---|---|
| Template seed | `backend/app/seed/templates_seed.py` | Idempotent seeding of the 20 starter templates on startup if collection is empty. |
| Extend `template_routes.py` | existing | Add `GET /api/v1/templates?platform=<type>&tags=<csv>` filter endpoint. |

### Architectural bug to fix (Story PX-002)
- `project_routes.py`, `brand_routes.py`, `template_routes.py`, `comments_routes.py` have call sites using `get_db()` inferred-path rather than via `Depends(get_db)`. This violates project-context.md §5.1. Fix: refactor to `db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]` parameter injection.

---

## 7. New runtime dependencies (captured per project-context.md §R6)

**Revision #1 applied post-Winston-review:** `png-to-ico` removed (use server-side Pillow ICO instead — no new dep needed); `dompurify` added (SVG XSS protection was under-specified; Winston required it as a committed dep rather than a "verify later" hedge).

| Package | Type | License | Risk | Approval |
|---|---|---|---|---|
| `imagetracerjs` | npm, client (lazy) | MIT | Low — pure JS, ~60KB gzipped | ✅ implicit via user's "make sure all done" |
| `svgo` | npm, client-bundle (lazy) | MIT | Medium — ~300KB unmin; lazy-loaded only on cleanup path | ✅ implicit |
| `dompurify` | npm, client | MIT | Low — battle-tested XSS sanitizer | ✅ implicit (added per Winston review) |

All three are lazy-loaded on the logo cleanup / SVG-import / SVG-export paths so the main bundle (hub + gallery + basic editor) doesn't pay the cost until the feature is used.

**ICO export:** implemented server-side via Pillow's native `Image.save('logo.ico', format='ICO', sizes=[(16,16),(32,32),...])`. Pillow is already in `backend/requirements.txt`. Zero new dep, zero client-bundle impact. New route: `POST /api/v1/export/ico` accepting an SVG body + size list, returning the binary ICO.

**Deferred / not-in-MVP:**
- `paper.js` — v1+ for SVG booleans
- `vtracer` (Rust server-side) — v1+ for higher-quality vectorization

## 7.1 Shared platform-preset constants (FE / BE)

**Revision #1 applied post-Winston-review:** platform-preset canonical list is load-bearing for the PRD's success metric AND for backend template filtering. To prevent silent drift between FE and BE, we maintain a single source of truth.

- **Source of truth:** `backend/app/core/platform_presets.py` — a Python module exporting `PLATFORM_PRESETS: list[PlatformPreset]` and `PLATFORM_IDS: frozenset[str]`.
- **Frontend consumption:** `src/app/core/constants/platform-presets.ts` is generated at build time from the Python module via a small codegen script (`backend/scripts/gen_platform_presets_ts.py`) OR maintained as a mirror with a pytest guard that fails CI if the two drift.
- **Preferred approach:** mirror-with-guard (no build-time codegen complexity). pytest `test_platform_preset_parity.py` reads both and asserts equality on ids/dims/labels.
- **Any new platform preset must be added in the Python file first.**

---

## 8. Data model additions (MongoDB)

### 8.1 `templates` collection (extended)

```json
{
  "_id": "<ObjectId>",
  "name": "Festive Sale IG Post",
  "platform": "ig-post",
  "tags": ["Festive", "Bold"],
  "canvas_json": { ...fabric.js serialized scene... },
  "thumbnail_data_url": "data:image/png;base64,...",
  "palette_slots": [
    { "role": "primary",   "default": "#FF5722" },
    { "role": "secondary", "default": "#FFEB3B" },
    { "role": "text",      "default": "#212121" }
  ],
  "is_template": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### 8.2 `brand_kits` collection — extended with `logos` array

```json
{
  "_id": "<ObjectId>",
  "user_id": "<user_id>",
  "colors": [ ...existing... ],
  "fonts":  [ ...existing... ],
  "logos":  [
    { "id": "<uuid>", "name": "Primary", "svg_asset_id": "...", "png_asset_id": "...", "uploaded_at": "..." }
  ]
}
```

### 8.3 `projects` collection — add `platform` + `source_template_id`

```json
{
  "_id": "<ObjectId>",
  "owner_user_id": "...",
  "name": "My IG Post",
  "platform": "ig-post",
  "canvas_json": { ... },
  "thumbnail_data_url": "...",
  "source_template_id": "<templates._id or null>",
  "brand_kit_applied_at": "ISO8601 or null",
  "created_at": "...",
  "updated_at": "..."
}
```

---

## 9. Performance budget

| Surface | Budget |
|---|---|
| Hub load (cold) | < 500ms TTI on fast 3G |
| Editor open with template | < 1500ms to interactive |
| Vectorize 500×500 PNG (typical logo) | < 3s client-side |
| BG removal (client `@imgly`) | < 5s on M1/modern laptop; fall back to server `rembg` if > 8s |
| Bundle main chunk | < 500KB gzipped (Angular 21 new-control-flow helps) |

---

## 10. Testing strategy (per project-context.md §4.4 + §5.4)

- **Frontend:** Vitest on every new service + component. Target 80% line coverage on services.
- **Backend:** pytest + pytest-asyncio + httpx.AsyncClient. Target 80% branch coverage on services + routers.
- **Integration:** Playwright or Cypress (install via `bmad-testarch-framework` in Sprint 1.5) for top-5 user flows: hub → template → edit → export; logo creator; logo cleanup; brand kit apply; resize to another platform.
- **God-nodes must have tests before new features touch them.** Story PX-001 is the precondition for this.

---

## 11. Observability

- Frontend: `console.error` → Sentry-compatible hook (defer actual Sentry — self-hosted Glitchtip is v1).
- Backend: structured logging via stdlib `logging` with JSON formatter. No APM SaaS in MVP.
- Graphify refresh runs post-merge (git hook installed via `graphify hook install` — confirm with user).

---

## 12. Security

- File upload: MIME sniff, size ≤ 10MB, Pillow verify. Reject SVG with `<script>` tags — use `DOMPurify` on import (new dep needed? Check — might already be in Angular sanitizer pipeline; verify during PX-040).
- Backend: CORS explicit origin list (no `*`).
- JWT secrets from `.env`, never committed.
- rate-limit on AI-cleanup endpoints if abused (v1).

---

## 13. Escalations remaining for the user

1. **Approve final list of new npm deps:** `imagetracerjs`, `svgo`, `dompurify`. *(Currently treated as implicit-approved via "make sure all done." Will `npm install` during PX-040 / PX-042 / PX-003 unless overridden.)* `png-to-ico` was DROPPED in revision #1 — ICO export now uses server-side Pillow, no new dep.
2. **Brand Kit default for first-time users:** colors-on-load is tied to user's Brand Kit. If Brand Kit is empty, Hub should still render, but gallery auto-apply becomes a no-op. Confirm acceptable.
3. **Self-hosted deployment target:** MVP assumes single Docker Compose. If multi-node is desired later, the `backend/uploads/` filesystem must be moved to object storage. Out of MVP scope, but flag for v1.
4. **Logo mode-chooser default:** on first visit, should the "Start from scratch" card be pre-focused, or neither? (Orion's current default: neither — deliberate tap required.)

## 14. Security additions (revision #1 per Winston review)

- **SVG XSS (SVG upload + SVG trace output):** every SVG that enters the editor is run through `dompurify` with `FORBID_TAGS: ['script', 'foreignObject']` and `FORBID_ATTR: ['onload', 'onerror', 'onclick', ...]` and external-resource `<image href>` policies. Backend re-parses with `defusedxml.lxml` and rejects on `<script>` or `xlink:href` to external URLs.
- **CSRF:** FastAPI is a stateless JWT-auth API so CSRF is not a primary risk for authenticated XHR; however the `/api/v1/export/ico` endpoint accepts binary SVG — add an explicit `Content-Type: image/svg+xml` check and a request-size limit (1MB) to prevent amplification.
- **SSRF:** Any endpoint that fetches user-supplied URLs (e.g., if we ever add "import from URL") must run through an allow-list and block RFC1918 / link-local / cloud-metadata ranges. Currently no such endpoint in MVP — flagged for v1+.
- **File upload re-state:** MIME sniff + size limit + Pillow `verify()` per existing project-context.md §5.3 — reiterate and add SVG-specific sanitize step.

## 15. Data migration plan (revision #1 per Winston review)

The `projects` collection predates MVP. Existing documents lack the new `platform` and `source_template_id` fields.

- **Forward migration (one-time, idempotent):** `backend/app/migrations/0001_projects_add_platform.py` runs in `lifespan()` startup (gated by env `PIXELS_RUN_MIGRATIONS=1` or by a `schema_version` marker on a `meta` collection):
  - For every project missing `platform`, infer from `canvas_json` width/height: 1080×1080 → `ig-post`; 1080×1920 → `ig-story`; 1200×627 → `linkedin-post`; 1584×396 → `linkedin-banner`; 1280×720 → `yt-thumb`; anything else → `custom`.
  - For every project missing `source_template_id`, set to `null`.
  - Add `schema_version: 1` to `meta` collection on completion.
- **Backward-compat at read time:** `project_routes.py` returns any missing field as `null` / `custom` so pre-migration deployments keep working if migration hasn't run.
- **Rollback:** migration is pure-additive; rollback is a no-op (leave fields, old code ignores them).

---

## 14. Reviewer sign-off

| Reviewer | Role | Status |
|---|---|---|
| Winston | Self-review | ✅ |
| John | PRD alignment | ⏳ pending |
| Sally | Component boundary / UX alignment | ⏳ pending |
| Amelia | Implementability | ⏳ pending |
| Orion | Decisions log alignment | ⏳ pending |
