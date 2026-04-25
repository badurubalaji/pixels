"""Happy-path coverage for auth_routes endpoints after the Depends refactor."""
from __future__ import annotations

import io

from httpx import AsyncClient


def _png_bytes() -> bytes:
    """Render a tiny valid PNG via Pillow for avatar-upload tests."""
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color=(124, 58, 237)).save(buf, format="PNG")
    return buf.getvalue()


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


async def test_change_password_happy_path(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """POST /api/auth/me/password rotates the password (PX-075)."""
    resp = await client.post(
        "/api/auth/me/password",
        headers=auth_headers,
        json={"current": "password123", "next": "newPassword456"},
    )
    assert resp.status_code == 204
    # New password works for login.
    login = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "newPassword456"},
    )
    assert login.status_code == 200
    # Old password no longer works.
    old = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert old.status_code == 401


async def test_change_password_wrong_current_returns_401(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Wrong ``current`` is rejected with 401 (PX-075)."""
    resp = await client.post(
        "/api/auth/me/password",
        headers=auth_headers,
        json={"current": "not-the-real-password", "next": "newPassword456"},
    )
    assert resp.status_code == 401


async def test_change_password_short_next_returns_400(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """``next`` shorter than 6 chars is rejected with 400 (PX-075)."""
    resp = await client.post(
        "/api/auth/me/password",
        headers=auth_headers,
        json={"current": "password123", "next": "abc"},
    )
    assert resp.status_code == 400


async def test_change_password_same_as_current_returns_400(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """``next`` identical to ``current`` is rejected (PX-075)."""
    resp = await client.post(
        "/api/auth/me/password",
        headers=auth_headers,
        json={"current": "password123", "next": "password123"},
    )
    assert resp.status_code == 400


async def test_change_password_requires_auth(client: AsyncClient) -> None:
    """POST /api/auth/me/password without a token returns 401 (PX-075)."""
    resp = await client.post(
        "/api/auth/me/password",
        json={"current": "x", "next": "yyyyyy"},
    )
    assert resp.status_code in (401, 403)


async def test_upload_avatar_happy_path(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """POST /api/auth/me/avatar persists the avatar and surfaces a URL (PX-073)."""
    files = {"file": ("me.png", _png_bytes(), "image/png")}
    resp = await client.post("/api/auth/me/avatar", headers=auth_headers, files=files)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["avatar_url"] is not None
    assert body["avatar_url"].startswith("/api/auth/avatar/")

    # GET /me reflects it.
    me = await client.get("/api/auth/me", headers=auth_headers)
    assert me.json()["avatar_url"] is not None


async def test_get_avatar_serves_uploaded_file(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """GET /api/auth/avatar/{user_id} returns the persisted bytes (PX-073)."""
    files = {"file": ("me.png", _png_bytes(), "image/png")}
    upload = await client.post("/api/auth/me/avatar", headers=auth_headers, files=files)
    user_id = upload.json()["id"]

    fetch = await client.get(f"/api/auth/avatar/{user_id}")
    assert fetch.status_code == 200
    assert fetch.headers["content-type"].startswith("image/")
    assert len(fetch.content) > 0


async def test_upload_avatar_rejects_unsupported_mime(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Non-image MIME types are rejected with 400 (PX-073)."""
    files = {"file": ("note.txt", b"hello", "text/plain")}
    resp = await client.post("/api/auth/me/avatar", headers=auth_headers, files=files)
    assert resp.status_code == 400


async def test_upload_avatar_rejects_oversize(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Avatars larger than 1MB are rejected with 400 (PX-073)."""
    big = b"\x89PNG\r\n\x1a\n" + b"\x00" * (1_100_000)
    files = {"file": ("big.png", big, "image/png")}
    resp = await client.post("/api/auth/me/avatar", headers=auth_headers, files=files)
    assert resp.status_code == 400


async def test_upload_avatar_rejects_corrupt_image(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Pillow verify() catches MIME-spoofed garbage with 422 (PX-073)."""
    # Claims image/png but is just plain bytes — Pillow rejects on verify().
    files = {"file": ("fake.png", b"this is not a png", "image/png")}
    resp = await client.post("/api/auth/me/avatar", headers=auth_headers, files=files)
    assert resp.status_code == 422


async def test_delete_avatar_clears_url(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """DELETE /api/auth/me/avatar nulls avatar_url and removes the file (PX-073)."""
    files = {"file": ("me.png", _png_bytes(), "image/png")}
    await client.post("/api/auth/me/avatar", headers=auth_headers, files=files)

    resp = await client.delete("/api/auth/me/avatar", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["avatar_url"] is None

    me = await client.get("/api/auth/me", headers=auth_headers)
    assert me.json()["avatar_url"] is None


async def test_delete_avatar_is_idempotent_when_none(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """DELETE returns 200 even when no avatar is set (PX-073)."""
    resp = await client.delete("/api/auth/me/avatar", headers=auth_headers)
    assert resp.status_code == 200


async def test_upload_avatar_requires_auth(client: AsyncClient) -> None:
    """POST /api/auth/me/avatar without a token returns 401/403 (PX-073)."""
    files = {"file": ("me.png", _png_bytes(), "image/png")}
    resp = await client.post("/api/auth/me/avatar", files=files)
    assert resp.status_code in (401, 403)


async def test_get_avatar_404_for_unknown_user(client: AsyncClient) -> None:
    """GET /api/auth/avatar/{id} 404s when the file doesn't exist (PX-073)."""
    resp = await client.get("/api/auth/avatar/507f1f77bcf86cd799439999")
    assert resp.status_code == 404
