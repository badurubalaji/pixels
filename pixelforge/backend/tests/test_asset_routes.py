"""Happy-path coverage for asset_routes endpoints after the Depends refactor."""
from __future__ import annotations

from httpx import AsyncClient


async def test_list_assets_empty(client: AsyncClient) -> None:
    """GET /api/assets returns [] when none uploaded."""
    resp = await client.get("/api/assets")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_upload_and_delete_asset(client: AsyncClient) -> None:
    """POST /api/assets/upload then DELETE /api/assets/{id} round-trip."""
    # Minimal 1x1 PNG
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f"
        b"\x00\x00\x01\x01\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("t.png", png_bytes, "image/png")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["filename"] == "t.png"
    asset_id = body["id"]

    # List reflects it
    listing = await client.get("/api/assets")
    assert listing.status_code == 200
    assert any(a["id"] == asset_id for a in listing.json())

    # Delete
    deleted = await client.delete(f"/api/assets/{asset_id}")
    assert deleted.status_code == 200
    assert deleted.json()["status"] == "deleted"
