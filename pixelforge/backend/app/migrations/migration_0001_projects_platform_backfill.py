"""Migration 0001 — backfill the ``platform`` field on legacy project rows.

Background:
    Story PX-060 T-0 introduces the ``platform`` field on projects so the
    editor's Brand-Kit auto-apply heuristic and the dashboard filters can
    segment designs by target medium (Instagram post, YouTube thumb, …).

    Projects created before PX-060 lack this field. This migration walks the
    ``projects`` collection and, for every doc missing ``platform``, infers
    it from the stored canvas dimensions (``width`` × ``height``) using the
    canonical ``PLATFORM_PRESETS`` table as a reverse lookup. Dimensions that
    do not match any preset get ``platform = "custom"``.

Guarantees:
    * Idempotent — docs that already carry a ``platform`` value are left
      untouched (the ``$exists: false`` filter in the Mongo query takes care
      of this cheaply).
    * Non-destructive — only adds a new field via ``$set``; never mutates
      existing canvas_json, thumbnails, or ownership records.
    * Silent on empty collections — the result summary reports ``total=0``
      and the caller logs a friendly message.

This migration is gated behind ``PIXELS_RUN_MIGRATIONS=1`` at lifespan
startup (see ``app/main.py``) — day-to-day API boots never re-scan.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.platform_presets import PLATFORM_PRESETS

logger = logging.getLogger(__name__)


def _infer_platform(width: int | None, height: int | None) -> str:
    """Reverse-lookup the platform id that matches ``width`` × ``height``.

    Args:
        width: Canvas width in pixels. ``None`` or non-positive values map to
            the ``"custom"`` sentinel.
        height: Canvas height in pixels. Same semantics as ``width``.

    Returns:
        The matching preset id (e.g. ``"ig-post"``), or ``"custom"`` when no
        preset dimensions line up with the supplied pair.

    Example:
        >>> _infer_platform(1080, 1080)
        'ig-post'
        >>> _infer_platform(1234, 567)
        'custom'
    """
    if not width or not height or width <= 0 or height <= 0:
        return "custom"
    for preset in PLATFORM_PRESETS:
        # WHY: `custom` itself has 0x0 sentinel dims — skip it in the reverse
        # lookup so a legacy 0x0 row doesn't double-match.
        if preset.id == "custom":
            continue
        if preset.width == width and preset.height == height:
            return preset.id
    return "custom"


async def migrate(db: Any) -> dict[str, int]:
    """Backfill ``platform`` on every project row that lacks it.

    Args:
        db: A Motor-compatible async database handle (real Mongo or
            ``mongomock_motor``). Must expose ``projects.find`` /
            ``projects.update_one`` / ``projects.count_documents``.

    Returns:
        Dict ``{updated, skipped, total}`` summarizing the run:
            * ``updated`` — docs whose ``platform`` was set by this pass.
            * ``skipped`` — docs that already had a ``platform`` value
              (counted separately so the idempotent path is observable).
            * ``total`` — overall document count.

    Raises:
        Never — Mongo errors bubble out, but callers (``main.lifespan``)
        catch them and log-and-continue so boot stays resilient.
    """
    total = await db.projects.count_documents({})
    # Count docs already migrated (have a non-null ``platform``) so the
    # summary clearly distinguishes "already done" from "none to do".
    already = await db.projects.count_documents({"platform": {"$exists": True, "$ne": None}})

    # Only scan docs missing ``platform`` — this is what makes the migration
    # cheap to re-run.
    cursor = db.projects.find(
        {"$or": [{"platform": {"$exists": False}}, {"platform": None}]},
        {"_id": 1, "width": 1, "height": 1, "canvas_json": 1},
    )

    updated = 0
    async for doc in cursor:
        width = doc.get("width")
        height = doc.get("height")
        platform = _infer_platform(width, height)
        await db.projects.update_one(
            {"_id": doc["_id"]},
            {"$set": {"platform": platform}},
        )
        updated += 1

    skipped = already
    logger.info(
        "migration 0001 projects.platform backfill: updated=%d skipped=%d total=%d",
        updated,
        skipped,
        total,
    )
    return {"updated": updated, "skipped": skipped, "total": total}
