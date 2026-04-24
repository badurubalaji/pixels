"""Integration tests for the 20 authored starter templates (PX-022b).

Runs the production seed loader against the *real* on-disk asset pairs under
``backend/app/seed/assets/`` and asserts distribution + schema invariants
from AC-1 through AC-5 of PX-022b.

Coverage map:

* AC-1 — 20 ``*.json`` files exist under the canonical canvas dir.
* AC-2 — 20 matching ``*.png`` thumbnails with identical stems.
* AC-3 — every template has 3-8 editable layers and ≥ 2 palette slots.
* AC-4 — ≥ 3 distinct tag families from the filter-chip vocabulary.
* AC-5 — no template embeds an external image asset (rects / circles /
  textboxes only) — license guardrail.
* AC-7 — full seed into mongomock yields exactly 20 documents with the
  expected platform distribution (5+4+4+3+2 under the repurpose strategy,
  plus 2 logo-tagged ig-posts = 7 ig-posts total).

These tests do not rely on the FastAPI startup hook; they call
:func:`seed_templates` directly against a mongomock database.
"""
from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import AsyncIterator

import pytest
import pytest_asyncio
from mongomock_motor import AsyncMongoMockClient
from PIL import Image

from app.seed.author_templates import SPECS
from app.seed.templates_seed import seed_templates

_CANVAS_DIR = Path(__file__).resolve().parents[1] / "app" / "seed" / "assets" / "templates_canvas_json"
_THUMB_DIR = Path(__file__).resolve().parents[1] / "app" / "seed" / "assets" / "templates_thumbnails"

# Accepted tag vocabulary (filter chips) — AC-4.
_TAG_FAMILIES = {"Bold", "Minimal", "Festive", "Corporate", "Playful", "Logo"}

# AC-3: each template must expose at least these two palette roles at minimum.
# The seed Template schema actually only requires a non-empty list, but the
# story's AC-3 mandates ≥ 2 slots.
_MIN_PALETTE_SLOTS = 2
_MIN_CANVAS_LAYERS = 3
_MAX_CANVAS_LAYERS = 8


@pytest_asyncio.fixture
async def seed_db() -> AsyncIterator[object]:
    """Fresh in-memory Mongo for the content-seed assertions.

    Yields:
        An ``AsyncMongoMockClient`` database named ``seed_content_test``.
    """
    client = AsyncMongoMockClient()
    db = client["seed_content_test"]
    yield db


def test_canvas_dir_has_20_json_files() -> None:
    """AC-1: the on-disk canvas dir contains exactly 20 template JSONs."""
    files = sorted(_CANVAS_DIR.glob("*.json"))
    assert len(files) == 20, (
        f"expected 20 canvas JSONs under {_CANVAS_DIR}, got {len(files)}"
    )


def test_thumb_dir_has_20_png_files_matching_stems() -> None:
    """AC-2: every JSON has a same-stem PNG, all ≤ 300×300, all readable."""
    json_stems = {p.stem for p in _CANVAS_DIR.glob("*.json")}
    png_stems = {p.stem for p in _THUMB_DIR.glob("*.png")}
    assert json_stems == png_stems, (
        f"stem mismatch: json-only={sorted(json_stems - png_stems)!r} "
        f"png-only={sorted(png_stems - json_stems)!r}"
    )
    assert len(png_stems) == 20

    # Every PNG must be loadable by Pillow and within the 300×300 cap.
    for png_path in _THUMB_DIR.glob("*.png"):
        with Image.open(png_path) as img:
            img.verify()
        with Image.open(png_path) as img:
            w, h = img.size
            assert w <= 300 and h <= 300, (
                f"{png_path.name} exceeds 300×300 ({w}×{h})"
            )


@pytest.mark.asyncio
async def test_full_seed_inserts_20_valid_docs(seed_db: object) -> None:
    """AC-7: seeding with the canonical dirs inserts exactly 20 docs."""
    inserted = await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=_CANVAS_DIR,
        thumb_dir=_THUMB_DIR,
    )
    assert inserted == 20
    count = await seed_db.templates.count_documents({})  # type: ignore[attr-defined]
    assert count == 20


@pytest.mark.asyncio
async def test_platform_distribution_matches_story(seed_db: object) -> None:
    """AC-2 distribution: 7 ig-post + 4 ig-story + 4 linkedin-post + 3 linkedin-banner + 2 yt-thumb.

    Under the repurpose strategy the 2 "logo" templates live in the ig-post
    slot (bringing its total to 7) and are identifiable by the ``"Logo"``
    tag. This test pins both the platform counts and the logo-tag count.
    """
    await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=_CANVAS_DIR,
        thumb_dir=_THUMB_DIR,
    )
    docs = [d async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    assert len(docs) == 20

    platform_counts = Counter(d["platform"] for d in docs)
    assert platform_counts == {
        "ig-post": 7,
        "ig-story": 4,
        "linkedin-post": 4,
        "linkedin-banner": 3,
        "yt-thumb": 2,
    }, f"unexpected distribution: {dict(platform_counts)!r}"

    logo_tagged = [d for d in docs if "Logo" in d["tags"]]
    assert len(logo_tagged) == 2
    # All Logo-tagged templates must live in the ig-post slot (repurpose
    # strategy invariant).
    for d in logo_tagged:
        assert d["platform"] == "ig-post"


@pytest.mark.asyncio
async def test_each_doc_meets_palette_and_tag_requirements(seed_db: object) -> None:
    """AC-3 + AC-4: every template has ≥ 2 palette slots and ≥ 1 tag-family tag."""
    await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=_CANVAS_DIR,
        thumb_dir=_THUMB_DIR,
    )
    docs = [d async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    assert docs, "expected non-empty templates collection"

    all_tags: set[str] = set()
    for d in docs:
        slots = d["palette_slots"]
        assert len(slots) >= _MIN_PALETTE_SLOTS, (
            f"{d['name']!r} has only {len(slots)} palette slots"
        )
        roles = {s["role"] for s in slots}
        # Require at least 2 distinct roles (AC-3 "named by role").
        assert len(roles) >= _MIN_PALETTE_SLOTS, (
            f"{d['name']!r} palette roles not distinct: {roles!r}"
        )
        # Every slot's default must parse as a hex color (schema enforces,
        # but we keep an explicit assertion for the content-authoring AC).
        for s in slots:
            assert s["default"].startswith("#")

        tags = set(d["tags"])
        assert tags & _TAG_FAMILIES, (
            f"{d['name']!r} has no tag from the filter family: {tags!r}"
        )
        all_tags.update(tags & _TAG_FAMILIES)

    # AC-4 demands ≥ 3 distinct tag families across the full set.
    assert len(all_tags) >= 3, (
        f"only {len(all_tags)} tag families represented: {all_tags!r}"
    )


@pytest.mark.asyncio
async def test_each_canvas_has_3_to_8_layers(seed_db: object) -> None:
    """AC-3 layer-count bounds: each canvas_json has 3-8 ``objects`` entries."""
    await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=_CANVAS_DIR,
        thumb_dir=_THUMB_DIR,
    )
    docs = [d async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    for d in docs:
        objs = d["canvas_json"].get("objects", [])
        assert _MIN_CANVAS_LAYERS <= len(objs) <= _MAX_CANVAS_LAYERS, (
            f"{d['name']!r} has {len(objs)} layers (want 3-8)"
        )


@pytest.mark.asyncio
async def test_no_template_embeds_raster_image_asset(seed_db: object) -> None:
    """AC-5 license guardrail: no ``image`` fabric objects in any canvas.

    Rects / circles / textboxes only. A fabric.js ``image`` object would
    typically carry a raster source (``src``) which is where licensing
    issues creep in for a starter-template set.
    """
    await seed_templates(
        seed_db,  # type: ignore[arg-type]
        canvas_dir=_CANVAS_DIR,
        thumb_dir=_THUMB_DIR,
    )
    docs = [d async for d in seed_db.templates.find({})]  # type: ignore[attr-defined]
    allowed = {"rect", "circle", "textbox", "text", "group", "path"}
    for d in docs:
        for obj in d["canvas_json"].get("objects", []):
            kind = obj.get("type", "")
            assert kind in allowed, (
                f"{d['name']!r} uses disallowed fabric object type "
                f"{kind!r} (allowed: {sorted(allowed)!r})"
            )


def test_spec_list_has_20_unique_stems() -> None:
    """AC-1 guardrail: the in-module SPECS list is the source of truth.

    Prevents a future editor from dropping an entry and relying on stale
    on-disk files to "stick" — any drift between ``SPECS`` and the asset
    dir will be caught by the other tests, but this one pins the in-memory
    source of truth first.
    """
    assert len(SPECS) == 20
    stems = [s.stem for s in SPECS]
    assert len(set(stems)) == 20, f"duplicate stems in SPECS: {stems!r}"
