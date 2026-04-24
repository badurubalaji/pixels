"""Idempotent seed-data loaders for the pixelforge backend.

Each sub-module owns one collection. At process start, when the relevant
``PIXELS_SEED_*`` environment flag is set, ``main.lifespan()`` invokes the
matching ``seed_*`` function. Seeders are idempotent by default: they skip
their work when the target collection is already populated unless called
with ``force=True``.

Exports:
    seed_templates: Seed ``templates`` collection from on-disk asset pairs.
"""
from __future__ import annotations

from app.seed.templates_seed import seed_templates

__all__ = ["seed_templates"]
