"""Happy-path coverage for asset_routes endpoints after the Depends refactor.

Extended in PX-003 with SVG upload coverage: clean SVG accepted, SVGs
containing ``<script>``, ``<foreignObject>``, event-handler attrs, or
external href refs are rejected by the defusedxml re-parse (AC-7).
"""
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


# ---------------------------------------------------------------------------
# PX-003 — SVG upload coverage
# ---------------------------------------------------------------------------
_CLEAN_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
    b'<circle cx="50" cy="50" r="40" fill="#123456"/></svg>'
)


async def test_upload_clean_svg_accepted(client: AsyncClient) -> None:
    """PX-003 AC-6: a clean, well-formed SVG uploads successfully."""
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("logo.svg", _CLEAN_SVG, "image/svg+xml")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["content_type"] == "image/svg+xml"
    assert body["filename"] == "logo.svg"


async def test_upload_svg_with_script_tag_rejected(client: AsyncClient) -> None:
    """PX-003 AC-7: <script> in uploaded SVG is rejected (400)."""
    malicious = (
        b'<svg xmlns="http://www.w3.org/2000/svg">'
        b'<script>alert(1)</script></svg>'
    )
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("evil.svg", malicious, "image/svg+xml")},
    )
    assert resp.status_code == 400
    assert "script" in resp.json()["detail"].lower()


async def test_upload_svg_with_external_href_rejected(client: AsyncClient) -> None:
    """PX-003 AC-7: SVG with external xlink:href is rejected (400)."""
    malicious = (
        b'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
        b'<image xlink:href="http://evil.example/x.png" width="10" height="10"/></svg>'
    )
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("external.svg", malicious, "image/svg+xml")},
    )
    assert resp.status_code == 400
    assert "href" in resp.json()["detail"].lower() or "external" in resp.json()["detail"].lower()


async def test_upload_svg_with_data_href_rejected(client: AsyncClient) -> None:
    """PX-003 AC-7: SVG with data: URL href is rejected (external scheme)."""
    malicious = (
        b'<svg xmlns="http://www.w3.org/2000/svg">'
        b'<image href="data:image/png;base64,AAAA" width="10" height="10"/></svg>'
    )
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("data.svg", malicious, "image/svg+xml")},
    )
    assert resp.status_code == 400


async def test_upload_svg_with_relative_href_accepted(client: AsyncClient) -> None:
    """PX-003 AC-7: SVG with relative-fragment href (#id) passes validation."""
    ok = (
        b'<svg xmlns="http://www.w3.org/2000/svg">'
        b'<use href="#gradient"/></svg>'
    )
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("rel.svg", ok, "image/svg+xml")},
    )
    assert resp.status_code == 200


async def test_upload_svg_with_onload_attr_rejected(client: AsyncClient) -> None:
    """PX-003 AC-7: SVG with on* attributes is rejected."""
    malicious = (
        b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'
    )
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("onload.svg", malicious, "image/svg+xml")},
    )
    assert resp.status_code == 400
    assert "onload" in resp.json()["detail"].lower() or "event" in resp.json()["detail"].lower()


async def test_upload_malformed_svg_rejected(client: AsyncClient) -> None:
    """PX-003 AC-7: malformed XML is rejected before any other processing."""
    malformed = b"<svg><this is not xml"
    resp = await client.post(
        "/api/assets/upload",
        files={"file": ("bad.svg", malformed, "image/svg+xml")},
    )
    assert resp.status_code == 400
