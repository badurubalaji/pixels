"""Tests for migration 0001 — projects.platform backfill (PX-060 T-0).

Exercises:
    * Happy path — docs missing ``platform`` get inferred values.
    * Idempotent path — rerunning the migration does not re-touch docs that
      already carry a ``platform``.
    * Custom fallback — dimensions that do not match any preset fall back
      to the ``"custom"`` sentinel.
"""
from __future__ import annotations

import pytest
from mongomock_motor import AsyncMongoMockClient

from app.migrations import migrate_projects_platform_backfill


@pytest.mark.asyncio
async def test_backfills_missing_platform_from_dims() -> None:
    """Docs without ``platform`` get a preset id inferred from width × height."""
    client = AsyncMongoMockClient()
    db = client["t"]

    await db.projects.insert_many([
        {"name": "ig", "width": 1080, "height": 1080},
        {"name": "yt", "width": 1280, "height": 720},
        {"name": "oddball", "width": 333, "height": 444},
    ])

    result = await migrate_projects_platform_backfill(db)
    assert result == {"updated": 3, "skipped": 0, "total": 3}

    ig = await db.projects.find_one({"name": "ig"})
    yt = await db.projects.find_one({"name": "yt"})
    odd = await db.projects.find_one({"name": "oddball"})
    assert ig is not None and ig["platform"] == "ig-post"
    assert yt is not None and yt["platform"] == "yt-thumb"
    assert odd is not None and odd["platform"] == "custom"


@pytest.mark.asyncio
async def test_skips_already_migrated_rows() -> None:
    """Re-running the migration is a no-op for rows that already have ``platform``."""
    client = AsyncMongoMockClient()
    db = client["t"]

    await db.projects.insert_many([
        {"name": "done", "width": 1080, "height": 1080, "platform": "ig-post"},
        {"name": "pending", "width": 1280, "height": 720},
    ])

    first = await migrate_projects_platform_backfill(db)
    assert first == {"updated": 1, "skipped": 1, "total": 2}

    # Idempotent second run — nothing left to update.
    second = await migrate_projects_platform_backfill(db)
    assert second == {"updated": 0, "skipped": 2, "total": 2}


@pytest.mark.asyncio
async def test_empty_collection_returns_zero_summary() -> None:
    """Empty collection yields a {0, 0, 0} summary without error."""
    client = AsyncMongoMockClient()
    db = client["t"]

    result = await migrate_projects_platform_backfill(db)
    assert result == {"updated": 0, "skipped": 0, "total": 0}
