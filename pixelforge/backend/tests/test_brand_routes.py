"""Happy-path coverage for brand_routes endpoints after the Depends refactor."""
from __future__ import annotations

from httpx import AsyncClient


async def test_get_brand_kit_empty(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    """GET /api/brand-kit returns an empty kit when none exists."""
    resp = await client.get("/api/brand-kit", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"colors": [], "fonts": [], "logos": []}


async def test_put_brand_kit_upserts(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    """PUT /api/brand-kit persists the kit; subsequent GET returns it."""
    payload = {
        "colors": ["#ff0000", "#00ff00"],
        "fonts": ["Inter"],
        "logos": [{"id": "l1", "name": "Logo", "dataUrl": "data:image/png;base64,AAA"}],
    }
    put = await client.put("/api/brand-kit", json=payload, headers=auth_headers)
    assert put.status_code == 200
    assert put.json() == payload

    got = await client.get("/api/brand-kit", headers=auth_headers)
    assert got.status_code == 200
    assert got.json() == payload
