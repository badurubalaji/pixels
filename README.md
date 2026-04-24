# pixels

**A free, self-hosted, open-source social-media content studio.**
Make Instagram / LinkedIn / YouTube-thumbnail posts and logos in under five minutes — without paying a Canva subscription.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031.svg?logo=angular&logoColor=white)](https://angular.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Status](https://img.shields.io/badge/Status-MVP%20in%20development-orange.svg)](_bmad-output/planning-artifacts/epics/epics.md)

---

## Why pixels exists

Canva's paywall blocks specific premium features at the exact moments you need them — background removal, magic resize, brand kit limits, premium templates. Existing free tools (Photopea, Penpot, GIMP, Inkscape, LibreOffice Draw) each solve part of the problem, but none give you the unified template-driven *experience* that makes Canva feel like one tool. Pixels is a self-hosted alternative built around the social-media-content workflow specifically: pick a platform, start from a brand-applied template, ship in five minutes.

This is **not** a full Canva clone. It is scoped to a personal social-media content studio and grows from there. See [`_bmad-output/planning-artifacts/vision/north-star-vision.md`](_bmad-output/planning-artifacts/vision/north-star-vision.md) for the long-term ambition and the explicit non-goals.

---

## What it does (MVP)

- **6-tile content hub** — Instagram Post, Instagram Story, LinkedIn Post, LinkedIn Banner, YouTube Thumbnail, Logo.
- **Platform-aware editor** — open at the right canvas size, swap text, drop in your logo, export.
- **Template gallery** — ~30 starter templates with your Brand Kit colors auto-applied.
- **Logo studio** — two modes:
  - **Create from scratch** — shape library, typography pairings, layered shapes.
  - **Clean up an AI logo** — drop a Midjourney / DALL-E / Leonardo PNG → background removal → vectorize → recolor to brand → multi-size export (SVG, ICO, transparent PNG).
- **Brand Kit integration** — colors, fonts, logos persist across every content type.
- **Multi-format export** — PNG, JPG, SVG, ICO multi-resolution, transparent PNG.
- **Accessibility** — WCAG AA contrast checking baked in.
- **Self-hosted** — Docker Compose up, no SaaS dependencies.

See the full feature breakdown and roadmap in [`_bmad-output/planning-artifacts/prd/mvp-prd.md`](_bmad-output/planning-artifacts/prd/mvp-prd.md).

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 21 (standalone components, signals, zoneless change detection, new control flow) |
| Canvas engine | fabric.js 7 |
| Frontend tests | Vitest 4 + jsdom |
| Backend | FastAPI 0.115 + Pydantic v2 + Uvicorn |
| Async DB | Motor (MongoDB) |
| Auth | JWT + bcrypt |
| Image AI | rembg (CPU, ONNX) + Pillow |
| PDF | pdf-lib (export only in MVP) |
| Background removal | @imgly/background-removal (client) + rembg (server) |
| Logo vectorization | imagetracerjs + svgo (client-side) |
| SVG safety | DOMPurify + defusedxml |
| Packaging | Docker Compose, Nginx |

---

## Repository layout

```
pixels/
├── pixelforge/                  # Angular 21 frontend + FastAPI backend
│   ├── src/                     # Angular app
│   ├── backend/                 # Python FastAPI service
│   ├── public/                  # PWA icons, static assets
│   ├── docker-compose.yml
│   └── ...
├── _bmad/                       # BMAD agile-AI framework (modules: core, bmm, bmb, cis, tea)
├── _bmad-output/                # Planning + implementation artifacts
│   ├── planning-artifacts/      # Vision, PRD, ARD, UX spec, epics
│   ├── implementation-artifacts/stories/   # Story files (PX-001, PX-002, ...)
│   └── orchestrator-log.md      # Audit log of every autonomous decision
├── docs/
│   └── project-context.md       # Binding standards: Angular 21 / FastAPI / scope discipline / docs rule
├── .claude/                     # Claude Code agent skills (BMAD specialists + Orion orchestrator)
├── LICENSE
└── README.md
```

---

## Quick start (development)

> Requires: Node 20+, Python 3.11+, MongoDB running locally (or via Docker), Docker Compose.

```bash
# Clone
git clone https://github.com/badurubalaji/pixels.git
cd pixels

# Frontend
cd pixelforge
npm install
npm start       # http://localhost:4200

# Backend (in another terminal)
cd pixelforge/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py   # http://localhost:8000

# Optional: full stack via Docker
cd pixelforge
docker compose up
```

### Seed starter templates (once backend is up)

```bash
cd pixelforge/backend
PIXELS_SEED_TEMPLATES=1 python run.py
```

### Run tests

```bash
# Frontend
cd pixelforge && npm test

# Frontend with coverage
npm test -- --coverage

# Backend (once Sprint 1 PX-002 lands the test harness)
cd pixelforge/backend && pytest
```

---

## How development is organized — BMAD + graphify

This project uses the [BMAD agile-AI methodology](https://github.com/bmad-code-org) and the [graphify](https://github.com/safishamsi/graphify) knowledge-graph tool to keep an AI-led delivery flow disciplined.

- **Specialist agents** live as Claude Code skills under `.claude/skills/`:
  - 📋 **John** (PM), 🎨 **Sally** (UX), 🏗️ **Winston** (architect), 💻 **Amelia** (developer), 📚 **Paige** (tech writer), 📊 **Mary** (analyst), 🎯 **Orion** (autonomous orchestrator).
- **Orion** drives the agile loop end-to-end: brief → PRD → architecture → epics → stories → dev → review → retrospective. Every autonomous decision is logged in [`_bmad-output/orchestrator-log.md`](_bmad-output/orchestrator-log.md).
- **graphify** maintains a live knowledge graph of the codebase at `pixelforge/graphify-out/` so any agent can answer "what touches X?" without re-reading the world. Refreshed on every merged PR.
- **Standards** are enforced by [`docs/project-context.md`](docs/project-context.md) — scope discipline, TSDoc/docstrings on every method, Angular 21 standalone-only conventions, FastAPI async-everywhere conventions.

---

## Roadmap

| Sprint | Focus | Status |
| --- | --- | --- |
| 1 (current) | Foundation: test baseline, hub, platform presets, seed templates, Brand-Kit SVG export | 🟡 in progress (PX-001 ✅ shipped) |
| 2 | Logo Creator mode, multi-format export, Brand-Kit auto-apply, gallery filters | 🔜 next |
| 3 | Logo AI-Cleanup pipeline (BG remove → vectorize → recolor → export) | 🔜 |
| 4–5 | Photo-editing hardening (crop, layer mask, healing) | 🔜 |
| 6–8 | Template library expansion (100+ templates) | 🔜 |
| 9+ | Decide next pillar based on real usage data | tba |

Full breakdown: [`_bmad-output/planning-artifacts/epics/epics.md`](_bmad-output/planning-artifacts/epics/epics.md).

### Explicitly NOT in scope (now or near-term)

Video editing, doc/docx editing, PDF editing beyond export, presentations, whiteboards, websites, print-on-demand with CMYK, third-party stock library, multi-user real-time collaboration. See vision §3 for why.

---

## Contributing

This is an early-stage personal project being built in the open. Bug reports and small PRs welcome. Larger contributions are best discussed first via an issue.

If contributing code, please read [`docs/project-context.md`](docs/project-context.md) — it lists the binding rules (scope discipline, doc requirements, Angular 21 + FastAPI standards, testing requirements). The full BMAD specialist flow (Sally for UX, Winston for arch, John for PRD, Amelia for code) is available locally via Claude Code; you're not required to use it, but PRs that follow it tend to land faster.

---

## License

[MIT](LICENSE) — use it, fork it, build on it.

---

## Acknowledgements

Built on the work of many open-source projects:
- [Angular](https://angular.dev), [Angular Material](https://material.angular.io)
- [fabric.js](https://github.com/fabricjs/fabric.js)
- [FastAPI](https://fastapi.tiangolo.com), [Pydantic](https://pydantic.dev), [Motor](https://motor.readthedocs.io)
- [rembg](https://github.com/danielgatis/rembg), [@imgly/background-removal](https://img.ly/showcases/cesdk/web/background-removal/web)
- [pdf-lib](https://pdf-lib.js.org), [imagetracerjs](https://github.com/jankovicsandras/imagetracerjs), [svgo](https://github.com/svg/svgo)
- [BMAD](https://github.com/bmad-code-org) agile-AI methodology
- [graphify](https://github.com/safishamsi/graphify) knowledge-graph tool

Inspired by Canva, but not affiliated with or endorsed by Canva Pty Ltd.
