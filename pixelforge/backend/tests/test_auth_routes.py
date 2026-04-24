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
