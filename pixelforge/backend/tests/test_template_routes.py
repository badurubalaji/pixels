"""Happy-path coverage for template_routes endpoints after the Depends refactor."""
from __future__ import annotations

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
