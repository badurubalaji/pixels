# Pixels — Project Context

Canonical standards, conventions, and workflow rules for the **pixels** project (Canva clone).
Loaded automatically by the BMAD dev agent (`bmad-agent-dev` / Amelia) on activation.

---

## 1. Project Overview

- **Name:** pixels
- **Type:** Canva-clone design / image editing web app
- **Root:** `/home/ashulabs/workspace/pixels`
- **Code root:** `pixelforge/` (monorepo-style: Angular frontend + Python backend side-by-side)
- **Deployment:** Docker Compose (`docker-compose.yml`, `Dockerfile.frontend`, `backend/Dockerfile`), Nginx in front of the built Angular bundle, FastAPI behind.

### Stack

| Layer        | Tech                                                        | Version (locked)           |
| ------------ | ----------------------------------------------------------- | -------------------------- |
| Frontend     | Angular + Angular Material + CDK                            | Angular 21.0.x             |
| Frontend fx  | fabric.js, pdf-lib, jszip, gif.js, @imgly/background-removal| per `package.json`         |
| Testing (FE) | Vitest + jsdom                                              | vitest 4.x                 |
| Backend      | FastAPI + Uvicorn                                           | FastAPI 0.115.x            |
| Persistence  | MongoDB via Motor (async)                                   | motor 3.7                  |
| Auth         | PyJWT + passlib/bcrypt                                      | pyjwt 2.10                 |
| Image AI     | rembg (CPU, ONNX runtime), Pillow                           | rembg 2.0.65               |
| Python       | 3.11+ (target latest stable)                                | —                          |

---

## 2. Non-Negotiable Rules

These override any "code quality" instinct. They exist because past sessions caused regressions by over-editing.

1. **Scope discipline.** Only modify what the current story / request explicitly asks for. No drive-by refactors, formatting, or cleanups in files you didn't need to touch.
2. **Stay in-layer.** Frontend stories edit only `pixelforge/src/**`. Backend stories edit only `pixelforge/backend/**`. Cross-layer change → pause and confirm with the user first.
3. **No speculative error handling, fallbacks, or validation** unless an AC demands it. Trust internal boundaries; validate only at system edges (HTTP, user input, external APIs).
4. **Never rewrite shared modules while touching a consumer.** If a shared helper is actually broken, open a separate BMAD story.
5. **Every task/subtask in a story must have passing tests before the box is checked.** No marking `[x]` without both implementation AND tests green.
6. **Story `File List` is the diff contract.** If your edits exceed it, stop and ask the user.
7. **Run the full test suite after each task.** `npm test` for frontend (Vitest), `pytest` for backend. Never proceed with failing tests.
8. **Never fabricate tests or test results.** Tests must actually exist and actually pass.
9. **One concern per commit.** Fix + unrelated change = two commits minimum.
10. **Libraries & APIs: verify via `context7` before using a version-sensitive API.** Training data may be stale vs. Angular 21 / FastAPI 0.115 behavior.

---

## 3. Workflow — BMAD Agile + Graphify

All substantive work flows through BMAD (`_bmad/`, artifacts in `_bmad-output/`).

### 3.1 New feature / requirement
1. `bmad-product-brief` *(if no brief exists yet)*
2. `bmad-create-prd` → `bmad-validate-prd`
3. `bmad-create-architecture` → solution design committed under `_bmad-output/planning-artifacts/`
4. `bmad-create-epics-and-stories` → epics + high-level stories
5. `bmad-sprint-planning` → sequenced sprint plan
6. `bmad-create-story` (per story) → produces a context-packed story file
7. `bmad-dev-story` (Amelia executes) → implement tasks/subtasks in order
8. `bmad-code-review` (Amelia `CR` / dedicated review) before merge
9. `bmad-retrospective` at epic close

### 3.2 Bug fix / small change
1. `bmad-create-story` with a tight scope + explicit File List
2. `bmad-dev-story` to execute
3. Code review + regression test
4. If the bug reveals a design issue → `bmad-correct-course`

### 3.3 Graphify usage
- First time / major refactor: `/graphify pixelforge` → build the full knowledge graph in `pixelforge/graphify-out/`.
- After code changes: `/graphify pixelforge --update` (incremental; AST-only for code-only changes, no LLM cost).
- Before touching an unfamiliar area: `/graphify query "<question>"` or `/graphify explain <SymbolName>` to see neighbors + blast radius.
- Consult the graph **before** editing to spot cross-file consumers — this is the scope-discipline tool.
- Consider installing the git post-commit hook: `graphify hook install` (keeps graph fresh automatically).

### 3.4 Documentation
- Planning artifacts → `_bmad-output/planning-artifacts/`
- Implementation artifacts / story files → `_bmad-output/implementation-artifacts/`
- Ambient project docs (this file, architecture diagrams, ADRs) → `docs/`
- Never create ad-hoc top-level `*.md` files. Use the folders above.

---

## 4. Angular 21 Frontend Standards (`pixelforge/src/**`)

Target: **Angular 21.x** with `@angular/cli 21`, `@angular/build`, TypeScript 5.9.

### 4.1 Architecture
- **Standalone components only.** No `NgModule` declarations for new code. Use `imports: [...]` directly on components.
- **Signals-first state.** Use `signal()`, `computed()`, `effect()`, and `input()` / `output()` / `model()` APIs for component IO. Prefer signals over `BehaviorSubject` for UI state. Use RxJS only for event streams / async pipelines where it earns its weight.
- **New control flow syntax** in templates: `@if`, `@for` (with required `track`), `@switch`, `@defer`. Do **not** use `*ngIf` / `*ngFor` / `*ngSwitch` in new templates.
- **Zoneless change detection** is the default target for new features (`provideZonelessChangeDetection()` in `app.config.ts`). Do not add `zone.js`-dependent patterns.
- **Functional guards / resolvers / interceptors** (`CanActivateFn`, `HttpInterceptorFn`) — not class-based.
- **`inject()` over constructor DI** in services, guards, interceptors, and standalone components unless constructor DI is necessary.
- **Lazy-load routes** via `loadComponent` / `loadChildren`. Use `@defer` for heavy sub-trees (canvas tools, background-removal UI, PDF export).

### 4.2 Code style
- File naming: kebab-case. Components end in `.component.ts`, services in `.service.ts`, directives in `.directive.ts`, pipes in `.pipe.ts`.
- One public class per file. Co-locate template + styles unless they exceed ~150 lines.
- Prefer `OnPush` change detection on components. With signals this is essentially free.
- Strict template type checking (`"strictTemplates": true`) and `"strict": true` in tsconfig must stay on.
- Prettier config: `printWidth: 100`, `singleQuote: true` (already set in `package.json`).
- Use `@angular/material` and `@angular/cdk` primitives before hand-rolling UI. Customize via Material tokens / theming.
- SCSS: component-scoped styles. Global styles only in `src/styles.scss`. Use CSS custom properties for theme tokens; avoid `::ng-deep`.
- Assets: put static design assets in `public/`; runtime-generated assets live in `src/assets/`.

### 4.3 Canvas / image editor specifics
- Canvas engine: **fabric.js 7**. Centralize all fabric interactions behind an `EditorService` so components stay dumb.
- Heavy work (background removal, PDF export, GIF encode, QR codes) must run off the main thread (Web Worker) or behind `@defer`. Never block the UI.
- Service Worker (PWA) is enabled (`ngsw-config.json`) — any new asset category added must be declared there, or it won't cache.
- File IO goes through `file-saver`, `jszip`, `pdf-lib`. Don't reinvent these.

### 4.4 Testing
- **Vitest** (`npm test`) is the source of truth for unit tests. `vitest.config.ts`, `src/test-setup.ts`.
- Every new component, service, pipe, directive ships with tests in the same folder (`*.spec.ts`).
- Use `TestBed` with the standalone API (`TestBed.configureTestingModule({ imports: [MyComponent] })`).
- Mock `HttpClient` via `provideHttpClientTesting()`.
- Cover signal behavior: assert values after `TestBed.flushEffects()` / fixture `detectChanges()`.
- Accessibility: at least one Axe-style check on any new page-level component (via `@axe-core/playwright` or Material's built-in a11y harnesses).

### 4.5 Forbidden
- `any` type (use `unknown` + narrowing).
- New `NgModule`s.
- `*ngIf`, `*ngFor`, `*ngSwitch` in new templates.
- `BehaviorSubject` where a signal suffices.
- Direct DOM manipulation outside a directive using `Renderer2` / `@angular/cdk` primitives.
- Inline styles or template strings longer than ~50 lines (extract).

---

## 5. Python / FastAPI Backend Standards (`pixelforge/backend/**`)

Target: **Python 3.11+**, **FastAPI 0.115.x**, **Pydantic v2**, **async everywhere**.

### 5.1 Architecture
- Layered layout under `backend/app/`:
  - `routers/` — FastAPI `APIRouter`s, one per domain (auth, designs, assets, export…).
  - `services/` — business logic. No FastAPI imports here.
  - `repositories/` — Motor/MongoDB data access. No business rules.
  - `schemas/` — Pydantic v2 models for request/response DTOs.
  - `models/` — internal domain models (if distinct from schemas).
  - `core/` — config, security, logging, dependencies.
  - `workers/` — long-running / CPU-bound tasks (rembg, image conversion) dispatched via `BackgroundTasks` or a task queue.
- **Dependency injection** via FastAPI `Depends(...)`. No globals for DB / config / auth state.
- **Async all the way down.** Use `async def` for endpoints and services. Use `motor` (already installed) for Mongo; never `pymongo` sync in request path.
- **CPU-bound work** (rembg, Pillow ops) offloaded to a thread / process pool via `asyncio.to_thread` or `run_in_executor`, never inline in async endpoints.

### 5.2 Code style
- **Ruff** for lint + import sort + format (single tool, replaces black/isort/flake8). Target line length 100.
- **mypy strict** (`strict = true`) on `app/`. No `# type: ignore` without a reason comment.
- Type hints everywhere, including return types. `from __future__ import annotations` at top of every module.
- Use `pydantic.BaseModel` for all request/response shapes. Use `Field(...)` with constraints, not ad-hoc validation.
- Use `Annotated[...]` dependency style: `db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]`.
- `logging` via `structlog` or stdlib `logging` with structured extras. Never `print`.
- Config via `pydantic-settings` (`BaseSettings`). Read from env; never hardcode secrets.

### 5.3 Security
- Never log tokens, passwords, or full JWT payloads.
- Hash passwords with `bcrypt` (via passlib). Min cost factor 12.
- JWT: short access TTL (≤ 15 min), refresh-token rotation. Store token version per user to support revocation.
- Validate and whitelist all file uploads (size limit, MIME sniff, extension allow-list). Image uploads go through Pillow `verify()` before any further processing.
- CORS: explicit origins in config; no `*`.
- Always use `pydantic.EmailStr`, `HttpUrl`, etc. for typed validation.
- Review every new endpoint against OWASP Top 10 before merging.

### 5.4 Testing
- **pytest** + **pytest-asyncio** + `httpx.AsyncClient` against `app` via `LifespanManager`.
- MongoDB tests use a dedicated test DB (never prod) — spun up via docker-compose test profile or `mongomock-motor` for unit-level.
- Target ≥ 80 % branch coverage on `services/` and `routers/`.
- Contract tests for every router endpoint covering: happy path, 4xx validation failures, auth enforcement, rate-limit / payload-size edges.

### 5.5 Forbidden
- Sync DB calls in async endpoints.
- Blocking CPU work inside `async def` endpoints (must be offloaded).
- `pydantic v1` patterns (`@validator`, `Config` class). Use v2 (`@field_validator`, `model_config = ConfigDict(...)`).
- Catch-all `except Exception:` without re-raise + structured log.
- Returning ORM / DB objects directly; always go through a Pydantic response model.

---

## 6. Documentation in Code — JSDoc / Docstrings on EVERY method

**Non-negotiable, project-wide rule.** Every function, method, class, and non-trivial module exports documentation so the *next* agent modifying the code has full context without reading every caller.

This overrides any general "minimize comments" guidance. In **pixels**, verbose and explicit is correct.

### 6.A Frontend (TypeScript / Angular) — TSDoc / JSDoc

Every exported or public function, method, class, decorator, guard, pipe, service, interceptor, directive, and signal factory must carry a TSDoc block. Keep `@param` / `@returns` even when types are obvious from the signature — the *intent* and *contract* is what documentation captures.

Minimum required tags:
- First line: one-sentence summary in imperative mood (what it does, not "this function…").
- `@param name - description including units, bounds, and null/undefined semantics`
- `@returns description including edge-case return values`
- `@throws ErrorType - when the error is raised`
- `@example` — at least one compact usage example for any public API a consumer will call.
- `@remarks` — design intent, invariants, performance notes, why it exists.
- `@see` — link to related symbols, story ID, or ADR.

Additionally document:
- Angular inputs/outputs/signals: describe the contract (when it fires, what it emits).
- RxJS operators and observables: document emission cadence, completion behavior, error behavior.
- Services: class-level TSDoc explaining responsibility boundary and lifecycle (`providedIn`).
- Any `// eslint-disable` / `@ts-expect-error` requires a one-line reason comment explaining WHY — forever.

### 6.B Backend (Python / FastAPI) — Google-style docstrings

Every function, method, class, and module must have a docstring. Style: **Google** (compatible with mypy, ruff-pydocstyle rule `D`, Sphinx/napoleon).

Minimum required sections:
- Summary line — imperative mood, under 100 chars.
- `Args:` — each parameter with type and semantic meaning (units, bounds, optionality).
- `Returns:` — type and meaning; describe all branches if return varies.
- `Raises:` — every exception type the caller can expect.
- `Example:` — doctest-compatible where practical.

Additionally:
- Module-level docstring at the top of every `.py` describing the module's responsibility.
- Class docstrings describe responsibility, invariants, and expected lifecycle.
- FastAPI endpoints: use the function docstring for OpenAPI description (FastAPI auto-picks it up). Include the intent, auth requirement, and error responses.
- Pydantic models: `Field(..., description=...)` on every field (flows to OpenAPI).
- Enable ruff rules `D` (pydocstyle, Google convention) — missing-docstring should **fail CI**.

### 6.C Intent-level comments

Beyond per-function docs, also comment:
- **Non-obvious "why"** — every branch or algorithm choice that isn't self-evident. Prefix with `# WHY:` (Python) / `// WHY:` (TS) to make intent explicit.
- **Invariants** — preconditions / postconditions that callers must uphold.
- **Workarounds** — bug workarounds link the external issue (`# workaround: upstream issue <URL>`).
- **TODOs** — format `TODO(story-id): what + when removable`. Never leave a bare `TODO`.

### 6.D What still does NOT need a comment

- Trivial getters/setters with no logic (docstring on the class is enough).
- Test `it(...)` / `test_...` names that already read as sentences.
- Re-exports (`export * from ...`).

### 6.E Enforcement

- Frontend: add `eslint-plugin-tsdoc` + `eslint-plugin-jsdoc` → warn on missing block, error on malformed tags.
- Backend: `ruff` with `select = ["D"]` and `convention = "google"` in `pyproject.toml`.
- Both: enforced in CI. A PR missing docstrings on new/changed public APIs must be blocked.

---

## 7. Cross-Cutting

### 7.1 API contract
- REST, JSON, versioned under `/api/v1/...`.
- Errors follow RFC 7807 (`application/problem+json`) shape.
- Pagination: cursor-based (`?cursor=...&limit=...`) — avoid offset pagination for scalability.
- All timestamps UTC, ISO 8601, suffix `Z`.

### 7.2 Git discipline
- Branch per story: `feat/<epic>-<story-id>-<slug>`, `fix/...`, `chore/...`.
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- One concern per commit (see Rule 9).
- PR body includes: story ID, acceptance criteria checklist, test evidence, screenshots for UI.

### 7.3 Library lookups
- Before using a version-sensitive API, consult `context7` (Angular 21 / FastAPI 0.115 docs) — training data may be outdated. This is especially important for:
  - Angular `inject()`, signals, control flow, `@defer`, zoneless setup.
  - Angular Material 21 theming API.
  - FastAPI lifespan / dependency / background task APIs.
  - Pydantic v2 field validators and serialization.

### 7.4 Done-ness definition (per story)
- [ ] All tasks/subtasks in story file checked off
- [ ] All new + existing tests green (frontend Vitest, backend pytest)
- [ ] Lint/type-check clean (Angular build, ruff, mypy)
- [ ] Story `File List` matches actual diff (scope discipline check)
- [ ] Manual smoke-test of the happy path if UI-touching
- [ ] Every new/changed public function, method, class has a TSDoc / Google-style docstring (Section 6)
- [ ] `Dev Agent Record` in story file updated with decisions + follow-ups
- [ ] Graphify updated (`/graphify pixelforge --update`) if code graph is in use
- [ ] PR opened with acceptance-criteria checklist

---

## 8. Autonomous Orchestrator — Orion

The pixels project has a dedicated **autonomous development orchestrator** agent named **Orion**, defined in `.claude/skills/bmad-agent-orchestrator/SKILL.md` and loadable via `/load-orion`.

Orion's job is to keep delivery moving without per-step human approvals:

- **Drives the full BMAD flow.** brief → PRD → architecture → epics/stories → sprint → dev → review → retro.
- **Delegates, never bypasses.** Always invokes the right specialist (Mary analyst, John PM, Sally UX, Winston architect, Amelia dev, Murat QA, Paige docs) rather than doing specialist work itself.
- **Mediates between agents** when outputs disagree, using a fixed tie-breaker order: PRD AC → project-context standards → simpler-to-revert → better blast radius.
- **Makes bounded autonomous decisions** (task ordering, naming, test choice, specialist selection, internal refactors within scope, patch/minor dep bumps with green tests).
- **Escalates to the human** for scope changes, new dependencies, major-version upgrades, schema/DB migrations, auth/security changes, destructive git ops, CI/CD, or anything on the project-context override list.
- **Keeps graphify fresh** between waves (`/graphify pixelforge --update`).
- **Audit log** at `_bmad-output/orchestrator-log.md` records every autonomous decision with rationale.

When to invoke Orion:
- `/load-orion` — activate Orion, get a STATUS DELTA, hand over the driver's seat.
- Any time you want "just keep going" without per-task approvals.
- When two specialist outputs conflict and you need a referee.

Orion's full decision boundaries (what she decides vs. escalates) are in the SKILL.md under `R5 — Autonomous decisions` and `R6 — ESCALATION`. Keep that file as the source of truth; update it when decision boundaries shift.

---

## 9. Quick Reference — BMAD Skills (by intent)

| Intent                          | Skill                              |
| ------------------------------- | ---------------------------------- |
| Understand existing code        | `bmad-document-project`            |
| New product concept             | `bmad-prfaq` / `bmad-product-brief`|
| Requirements doc                | `bmad-create-prd`                  |
| System design                   | `bmad-create-architecture`         |
| UX spec                         | `bmad-create-ux-design`            |
| Break into epics + stories      | `bmad-create-epics-and-stories`    |
| Sequence a sprint               | `bmad-sprint-planning`             |
| Prepare a single story          | `bmad-create-story`                |
| Implement a story               | `bmad-dev-story`                   |
| Code review                     | `bmad-code-review`                 |
| Test strategy                   | `bmad-testarch-test-design`        |
| Add E2E tests                   | `bmad-qa-generate-e2e-tests`       |
| Mid-sprint scope change         | `bmad-correct-course`              |
| Post-epic review                | `bmad-retrospective`               |
| Unsure what to run              | `bmad-help`                        |
| **Drive the whole project autonomously** | **`/load-orion` (bmad-agent-orchestrator)** |

---

_Keep this file up to date. When a rule changes, update it here — not in scattered comments or PR descriptions._
