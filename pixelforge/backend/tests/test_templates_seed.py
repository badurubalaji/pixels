"""Unit tests for :mod:`app.seed.templates_seed` (PX-022a).

Covers AC-1, AC-2, AC-3, AC-6 from the story:

* AC-1 — ``seed_templates`` returns an insert count.
* AC-2 — pairs ``*.json`` with same-stem ``*.png``; logs and skips half-pairs.
* AC-3 — idempotent when collection non-empty and ``force=False``.
* AC-3/force — ``force=True`` wipes and re-seeds.
* AC-6 — every inserted doc round-trips through the :class:`Template` model.
"""
from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import AsyncIterator

import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient

from app.seed.templates_seed import seed_templates

# 1×1 transparent PNG — shortest valid PNG the Template schema accepts.
_TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAeImBZsAAAAASUVORK5CYII="
)


@pytest_asyncio.fixture
async def seed_db() -> AsyncIterator[object]:
    """Fresh in-memory Mongo for the seeder — no FastAPI app needed.

    Yields:
        An ``AsyncMongoMockClient`` database named ``seed_test``.
    """
    client = AsyncMongoMockClient()
    db = client["seed_test"]
    yield db


def _write_pair(
    canvas_dir: Path,
    thumb_dir: Path,
    stem: str,
    *,
    name: str | None = None,
    platform: str = "ig-post",
    tags: list[str] | None = None,
    palette_slots: list[dict[str, str]] | None = None,
    write_thumb: bool = True,
) -> None:
    """Write a paired canvas.json and thumbnail.png to the asset dirs.

    Args:
        canvas_dir: Destination directory for the ``*.json`` file.
        thumb_dir: Destination directory for the ``*.png`` file.
        stem: Shared file stem (no extension).
        name: Optional ``name`` override written into the JSON.
        platform: Platform id written into the JSON.
        tags: Optional tag list. Defaults to ``["Bold"]``.
        palette_slots: Optional palette-slot list.
        write_thumb: When ``False``, skip writing the thumbnail (used to
            exercise the missing-pair skip path).
    """
    canvas_dir.mkdir(parents=True, exist_ok=True)
    thumb_dir.mkdir(parents=True, exist_ok=True)
    doc = {
        "name": name or stem.title(),
        "platform": platform,
        "tags": tags if tags is not None else ["Bold"],
        "canvas_json": {"objects": [], "background": "#ffffff"},
        "palette_slots": palette_slots
        or [{"role": "primary", "default": "#FF5722"}],
    }
    (canvas_dir / f"{stem}.json").write_text(json.dumps(doc), encoding="utf-8")
    if write_thumb:
        (thumb_dir / f"{stem}.png").write_bytes(_TINY_PNG)


async def test_empty_dirs_insert_zero(
    seed_db: object, tmp_path: Path
) -> None:
    """AC-3: empty asset dirs → 0 inserts, collection stays empty."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    canvas_dir.mkdir()
    thumb_dir.mkdir()

    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert inserted == 0
    assert await seed_db.templates.count_documents({}) == 0  # type: ignore[attr-defined]


async def test_seeds_valid_pair(seed_db: object, tmp_path: Path) -> None:
    """AC-2 / AC-6: one valid pair yields exactly one validated document."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    _write_pair(canvas_dir, thumb_dir, "festive-sale", platform="ig-post")

    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert inserted == 1

    docs = [d async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    assert len(docs) == 1
    assert docs[0]["name"] == "Festive-Sale"
    assert docs[0]["platform"] == "ig-post"
    assert docs[0]["is_template"] is True
    assert docs[0]["thumbnail_data_url"].startswith("data:image/png;base64,")


async def test_idempotent_second_call_returns_zero(
    seed_db: object, tmp_path: Path
) -> None:
    """AC-3: second call with ``force=False`` is a no-op."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    _write_pair(canvas_dir, thumb_dir, "one")

    first = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert first == 1

    second = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert second == 0
    assert await seed_db.templates.count_documents({}) == 1  # type: ignore[attr-defined]


async def test_force_reseeds(seed_db: object, tmp_path: Path) -> None:
    """AC-3 force path: wipes then re-inserts with current pair count."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    _write_pair(canvas_dir, thumb_dir, "one")
    _write_pair(canvas_dir, thumb_dir, "two", platform="ig-story")

    first = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert first == 2

    # Remove one pair, then force-reseed — should now hold 1 row.
    (canvas_dir / "two.json").unlink()
    (thumb_dir / "two.png").unlink()

    reseeded = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        force=True,
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert reseeded == 1
    assert await seed_db.templates.count_documents({}) == 1  # type: ignore[attr-defined]


async def test_missing_thumbnail_is_skipped(
    seed_db: object, tmp_path: Path
) -> None:
    """A JSON without a matching PNG is logged + skipped; does not raise."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    _write_pair(canvas_dir, thumb_dir, "good")
    _write_pair(canvas_dir, thumb_dir, "orphan", write_thumb=False)

    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert inserted == 1
    names = [d["name"] async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    assert names == ["Good"]


async def test_invalid_schema_is_skipped(
    seed_db: object, tmp_path: Path
) -> None:
    """A JSON that fails Template validation is skipped, not raised."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    # platform="custom" is explicitly disallowed for seed templates.
    _write_pair(canvas_dir, thumb_dir, "bad", platform="custom")
    _write_pair(canvas_dir, thumb_dir, "good", platform="ig-post")

    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert inserted == 1
    stored = [d["name"] async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    assert stored == ["Good"]


async def test_missing_canvas_dir_returns_zero(
    seed_db: object, tmp_path: Path
) -> None:
    """Nonexistent canvas directory → 0 inserts, warning logged."""
    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=tmp_path / "nope",
        thumb_dir=tmp_path / "also-nope",
    )
    assert inserted == 0


async def test_bare_scene_json_is_skipped(
    seed_db: object, tmp_path: Path
) -> None:
    """JSON that looks like a bare fabric scene (no top-level fields) is skipped."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    canvas_dir.mkdir()
    thumb_dir.mkdir()
    # Bare scene has no 'name'/'platform'/'tags'/'palette_slots'/'canvas_json'
    (canvas_dir / "bare.json").write_text(
        json.dumps({"objects": [], "version": "5.0"}), encoding="utf-8"
    )
    (thumb_dir / "bare.png").write_bytes(_TINY_PNG)

    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert inserted == 0


async def test_malformed_json_is_skipped(
    seed_db: object, tmp_path: Path
) -> None:
    """A JSON file with a syntax error is skipped, not raised."""
    canvas_dir = tmp_path / "canvas"
    thumb_dir = tmp_path / "thumbs"
    canvas_dir.mkdir()
    thumb_dir.mkdir()
    (canvas_dir / "broken.json").write_text("{not valid json", encoding="utf-8")
    (thumb_dir / "broken.png").write_bytes(_TINY_PNG)

    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=canvas_dir,
        thumb_dir=thumb_dir,
    )
    assert inserted == 0
