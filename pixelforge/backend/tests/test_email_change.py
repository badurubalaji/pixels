"""Email-change flow tests (PX-074).

Covers /api/auth/me/email (request) and /api/auth/me/email/confirm
(consume token). The mailer's OUTBOX captures payloads in test mode
(no RESEND_API_KEY), so we assert against that for the "did the email
get queued?" half of the flow.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.auth import create_email_change_token
from app.mailer import OUTBOX

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _clear_outbox():
    """Each test starts with an empty mailer OUTBOX."""
    OUTBOX.clear()
    yield
    OUTBOX.clear()


async def test_request_email_change_happy_path(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """POST /me/email queues confirm + notify emails and returns 204."""
    resp = await client.post(
        "/api/auth/me/email",
        headers=auth_headers,
        json={"new_email": "new@example.com", "password": "password123"},
    )
    assert resp.status_code == 204
    # Confirm + notify = 2 captured payloads.
    assert len(OUTBOX) == 2
    recipients = sorted(item["to"][0] for item in OUTBOX)
    assert recipients == ["new@example.com", "test@example.com"]
    # The confirm email body contains the token + base URL link.
    confirm = next(item for item in OUTBOX if item["to"][0] == "new@example.com")
    assert "confirm-email?token=" in confirm["html"]
    assert "Confirm new email" in confirm["html"]


async def test_request_email_change_wrong_password_401(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Bad current password rejects + queues no email."""
    resp = await client.post(
        "/api/auth/me/email",
        headers=auth_headers,
        json={"new_email": "new@example.com", "password": "not-correct"},
    )
    assert resp.status_code == 401
    assert OUTBOX == []


async def test_request_email_change_same_email_400(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Asking to change to the SAME address rejects."""
    resp = await client.post(
        "/api/auth/me/email",
        headers=auth_headers,
        json={"new_email": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 400


async def test_request_email_change_already_taken_409(
    client: AsyncClient, auth_headers: dict[str, str], mock_db
) -> None:
    """If the new email already belongs to another user, 409."""
    from datetime import datetime, timezone

    from app.auth import hash_password

    await mock_db.users.insert_one(
        {
            "email": "taken@example.com",
            "password_hash": hash_password("whatever123"),
            "name": "Existing",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
    )
    resp = await client.post(
        "/api/auth/me/email",
        headers=auth_headers,
        json={"new_email": "taken@example.com", "password": "password123"},
    )
    assert resp.status_code == 409


async def test_request_email_change_unauthenticated_401(client: AsyncClient) -> None:
    """No bearer token → 401 (or 403)."""
    resp = await client.post(
        "/api/auth/me/email",
        json={"new_email": "x@example.com", "password": "password123"},
    )
    assert resp.status_code in (401, 403)


async def test_confirm_email_change_happy_path(
    client: AsyncClient, auth_user: dict, mock_db
) -> None:
    """POST /me/email/confirm with a valid token swaps the email."""
    user_id = auth_user["id"]
    token = create_email_change_token(user_id, "fresh@example.com")

    resp = await client.post(
        "/api/auth/me/email/confirm",
        json={"token": token},
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["user"]["email"] == "fresh@example.com"
    assert payload["token"]  # fresh JWT issued

    # Login with the new email succeeds.
    login = await client.post(
        "/api/auth/login",
        json={"email": "fresh@example.com", "password": "password123"},
    )
    assert login.status_code == 200

    # Login with the old email no longer works.
    old = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert old.status_code == 401


async def test_confirm_email_change_invalid_token_400(client: AsyncClient) -> None:
    """Garbage token returns 400."""
    resp = await client.post(
        "/api/auth/me/email/confirm",
        json={"token": "not-a-real-token"},
    )
    assert resp.status_code == 400


async def test_confirm_email_change_expired_token_400(
    client: AsyncClient, auth_user: dict
) -> None:
    """Expired token returns 400 with "expired" message."""
    import os
    from datetime import datetime, timedelta, timezone

    import jwt as pyjwt

    secret = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    payload = {
        "sub": auth_user["id"],
        "new_email": "fresh@example.com",
        "token_type": "email_change",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
    }
    expired_token = pyjwt.encode(payload, secret, algorithm="HS256")

    resp = await client.post(
        "/api/auth/me/email/confirm",
        json={"token": expired_token},
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()


async def test_confirm_email_change_wrong_token_type_400(
    client: AsyncClient, auth_user: dict
) -> None:
    """Auth-style token (no token_type or token_type != email_change) rejected."""
    import os

    import jwt as pyjwt

    from datetime import datetime, timedelta, timezone

    secret = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    payload = {
        "sub": auth_user["id"],
        "email": "test@example.com",  # auth-style payload, no token_type
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    auth_token = pyjwt.encode(payload, secret, algorithm="HS256")

    resp = await client.post(
        "/api/auth/me/email/confirm",
        json={"token": auth_token},
    )
    assert resp.status_code == 400


async def test_confirm_email_change_taken_at_confirm_time_409(
    client: AsyncClient, auth_user: dict, mock_db
) -> None:
    """If between request + confirm someone else grabbed the new email, 409."""
    from datetime import datetime, timezone

    from app.auth import hash_password

    user_id = auth_user["id"]
    token = create_email_change_token(user_id, "race@example.com")
    # Simulate another user grabbing the address before we confirm.
    await mock_db.users.insert_one(
        {
            "email": "race@example.com",
            "password_hash": hash_password("whatever123"),
            "name": "Racer",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
    )

    resp = await client.post(
        "/api/auth/me/email/confirm",
        json={"token": token},
    )
    assert resp.status_code == 409
