"""Happy-path coverage for auth_routes endpoints after the Depends refactor."""
from __future__ import annotations

from httpx import AsyncClient


async def test_signup_returns_token(client: AsyncClient) -> None:
    """POST /api/auth/signup creates user and returns a token."""
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "new@example.com", "password": "password123", "name": "New"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token"]
    assert body["user"]["email"] == "new@example.com"


async def test_login_with_valid_credentials(client: AsyncClient) -> None:
    """POST /api/auth/login returns a token for a previously-created user."""
    await client.post(
        "/api/auth/signup",
        json={"email": "login@example.com", "password": "password123"},
    )
    resp = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "login@example.com"


async def test_me_returns_current_user(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """GET /api/auth/me echoes the token's user."""
    resp = await client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


async def test_update_me_sets_name(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """PATCH /api/auth/me writes the new name and returns it (PX-071)."""
    resp = await client.patch(
        "/api/auth/me", headers=auth_headers, json={"name": "Jane Bloggs"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Jane Bloggs"

    # Round-trip via GET to confirm persistence.
    getme = await client.get("/api/auth/me", headers=auth_headers)
    assert getme.json()["name"] == "Jane Bloggs"


async def test_update_me_trims_whitespace_and_clears_on_empty(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Whitespace-only or empty name clears the field (stored as None, PX-071)."""
    # First set a name.
    await client.patch("/api/auth/me", headers=auth_headers, json={"name": "Jane"})
    # Now clear it via whitespace.
    resp = await client.patch(
        "/api/auth/me", headers=auth_headers, json={"name": "   "}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] is None


async def test_update_me_rejects_oversize_name(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Names over 60 characters are rejected with 400 (PX-071)."""
    long_name = "x" * 61
    resp = await client.patch(
        "/api/auth/me", headers=auth_headers, json={"name": long_name}
    )
    assert resp.status_code == 400


async def test_update_me_requires_auth(client: AsyncClient) -> None:
    """PATCH /api/auth/me without a token returns 401 (PX-071)."""
    resp = await client.patch("/api/auth/me", json={"name": "x"})
    assert resp.status_code in (401, 403)
