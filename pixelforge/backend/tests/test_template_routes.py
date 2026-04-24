"""Happy-path coverage for template_routes endpoints after the Depends refactor.

Also covers PX-022a's seed-template endpoint at ``GET /api/v1/templates``
with ``?platform`` and ``?tags`` filters.
"""
from __future__ import annotations

from datetime import datetime, timezone

from httpx import AsyncClient


async def test_list_public_templates_empty(client: AsyncClient) -> None:
    """GET /api/public-templates returns [] when DB is empty."""
    resp = await client.get("/api/public-templates")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_publish_and_fetch_template(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """POST then GET /api/public-templates/{id} round-trips a template."""
    create_payload = {
        "name": "T1",
        "category": "Social",
        "description": "desc",
        "canvas_json": '{"objects":[]}',
        "width": 1080,
        "height": 1080,
    }
    created = await client.post(
        "/api/public-templates", json=create_payload, headers=auth_headers
    )
    assert created.status_code == 200
    tpl_id = created.json()["id"]

    got = await client.get(f"/api/public-templates/{tpl_id}")
    assert got.status_code == 200
    assert got.json()["name"] == "T1"
    assert got.json()["canvas_json"] == '{"objects":[]}'


async def test_list_public_templates_after_publish(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """GET /api/public-templates surfaces the published template."""
    payload = {
        "name": "T2",
        "category": "Poster",
        "canvas_json": "{}",
        "width": 800,
        "height": 1200,
    }
    await client.post("/api/public-templates", json=payload, headers=auth_headers)
    resp = await client.get("/api/public-templates")
    assert resp.status_code == 200
    names = [t["name"] for t in resp.json()]
    assert "T2" in names


async def test_delete_public_template(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """DELETE /api/public-templates/{id} removes the author's template."""
    payload = {
        "name": "T3",
        "canvas_json": "{}",
        "width": 100,
        "height": 100,
    }
    created = await client.post(
        "/api/public-templates", json=payload, headers=auth_headers
    )
    tpl_id = created.json()["id"]
    resp = await client.delete(
        f"/api/public-templates/{tpl_id}", headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"


# ---------------------------------------------------------------------------
# Seed-template endpoint (PX-022a) — GET /api/v1/templates
# ---------------------------------------------------------------------------


async def _insert_seed_templates(mock_db: object) -> None:
    """Insert three synthetic seed templates spanning platforms and tags.

    Args:
        mock_db: The per-test mongomock database handle injected by
            :func:`tests.conftest.client`.
    """
    now = datetime.now(timezone.utc)
    docs = [
        {
            "name": "Festive Sale IG Post",
            "platform": "ig-post",
            "tags": ["Festive", "Bold"],
            "canvas_json": {"objects": []},
            "thumbnail_data_url": "data:image/png;base64,AAA",
            "palette_slots": [{"role": "primary", "default": "#FF5722"}],
            "is_template": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Minimal LinkedIn Banner",
            "platform": "linkedin-banner",
            "tags": ["Minimal"],
            "canvas_json": {"objects": []},
            "thumbnail_data_url": "data:image/png;base64,BBB",
            "palette_slots": [],
            "is_template": True,
            "created_at": now,
            "updated_at": now,
        },
        {
            "name": "Bold YT Thumb",
            "platform": "yt-thumb",
            "tags": ["Bold"],
            "canvas_json": {"objects": []},
            "thumbnail_data_url": "data:image/png;base64,CCC",
            "palette_slots": [],
            "is_template": True,
            "created_at": now,
            "updated_at": now,
        },
    ]
    await mock_db.templates.insert_many(docs)  # type: ignore[attr-defined]


async def test_list_seed_templates_empty(client: AsyncClient) -> None:
    """AC-5: GET /api/v1/templates returns [] when no seed rows exist."""
    resp = await client.get("/api/v1/templates")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_seed_templates_returns_all(
    client: AsyncClient, mock_db: object
) -> None:
    """AC-5: no query params → all seed templates are returned."""
    await _insert_seed_templates(mock_db)
    resp = await client.get("/api/v1/templates")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    assert {t["name"] for t in data} == {
        "Festive Sale IG Post",
        "Minimal LinkedIn Banner",
        "Bold YT Thumb",
    }


async def test_list_seed_templates_filter_by_platform(
    client: AsyncClient, mock_db: object
) -> None:
    """AC-5: ?platform=ig-post returns only the ig-post template."""
    await _insert_seed_templates(mock_db)
    resp = await client.get("/api/v1/templates?platform=ig-post")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["platform"] == "ig-post"
    assert data[0]["name"] == "Festive Sale IG Post"


async def test_list_seed_templates_filter_by_single_tag(
    client: AsyncClient, mock_db: object
) -> None:
    """AC-5: ?tags=Bold returns only templates tagged Bold."""
    await _insert_seed_templates(mock_db)
    resp = await client.get("/api/v1/templates?tags=Bold")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert {t["name"] for t in data} == {
        "Festive Sale IG Post",
        "Bold YT Thumb",
    }


async def test_list_seed_templates_filter_by_multiple_tags_csv(
    client: AsyncClient, mock_db: object
) -> None:
    """AC-5: ?tags=Bold,Festive returns the OR-union of matching rows."""
    await _insert_seed_templates(mock_db)
    resp = await client.get("/api/v1/templates?tags=Bold,Festive")
    assert resp.status_code == 200
    data = resp.json()
    # "Festive Sale IG Post" has both tags; "Bold YT Thumb" has Bold.
    assert len(data) == 2
    assert {t["name"] for t in data} == {
        "Festive Sale IG Post",
        "Bold YT Thumb",
    }


async def test_list_seed_templates_filter_combined(
    client: AsyncClient, mock_db: object
) -> None:
    """AC-5: ?platform=<x>&tags=<y> composes as AND across the two filters."""
    await _insert_seed_templates(mock_db)
    resp = await client.get("/api/v1/templates?platform=yt-thumb&tags=Bold")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["name"] == "Bold YT Thumb"
