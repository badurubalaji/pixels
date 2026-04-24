"""Idempotent one-shot migrations for the pixelforge MongoDB schema.

Each sub-module declares a single ``async def migrate(db) -> dict`` entry
point that scans the target collection, applies its transformation, and
returns a ``{updated, skipped, total}`` summary.

Migrations are opt-in: the process runs them only when the environment
variable ``PIXELS_RUN_MIGRATIONS=1`` is set at startup. Failures must log
and continue — a bad migration should never take the API down.

Exports:
    migrate_projects_platform_backfill: Backfill legacy project rows with
        a ``platform`` field inferred from canvas dimensions (PX-060 T-0).
"""
from __future__ import annotations

from app.migrations.migration_0001_projects_platform_backfill import (
    migrate as migrate_projects_platform_backfill,
)

__all__ = ["migrate_projects_platform_backfill"]
