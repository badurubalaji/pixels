"""Pytest fixtures for the pixelforge backend test harness.

This module wires an ``httpx.AsyncClient`` against the FastAPI app with its
lifespan context honored (via ``asgi-lifespan``). MongoDB is replaced with
``mongomock_motor`` so tests run without a live database — callers that need
DB access receive a clean, in-memory async Mongo-compatible handle.

Fixtures:
    mock_db: AsyncMongoMockClient database — fresh per test.
    client:  httpx.AsyncClient bound to the live FastAPI app with DI overrides.
    auth_user: seeded test user document.
    auth_token: JWT bearer token for the seeded user.
    auth_headers: ready-to-use Authorization header dict.
"""
from __future__ import annotations

from typing import AsyncIterator

import pytest
import pytest_asyncio
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app import database as database_module
from app.auth import create_token
from app.database import get_db
from app.main import app


@pytest_asyncio.fixture
async def mock_db() -> AsyncIterator[object]:
    """Provide a fresh in-memory Mongo database per test.

    Yields:
        Database handle from mongomock-motor compatible with motor's API.
    """
    client = AsyncMongoMockClient()
    db = client["pixelforge_test"]
    yield db


@pytest_asyncio.fixture
async def client(mock_db: object) -> AsyncIterator[AsyncClient]:
    """Provide an httpx.AsyncClient bound to the app with ``get_db`` overridden.

    The override returns the per-test ``mock_db`` so handlers receive the
    mongomock database via ``Depends(get_db)``. The module-level
    ``database._connected`` flag is flipped True *after* the lifespan has run
    so endpoints gated on ``is_connected()`` execute real code paths against
    the mock.

    Yields:
        Configured AsyncClient targeting the in-process FastAPI app.
    """

    def _override_get_db() -> object:
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    async with LifespanManager(app):
        # After lifespan startup has run (and failed to connect to real
        # Mongo), force-flip module state so is_connected() checks pass
        # and any accidental fallback to database.db hits the mock.
        original_connected = database_module._connected
        original_db = database_module.db
        database_module._connected = True
        database_module.db = mock_db
        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
                yield ac
        finally:
            database_module._connected = original_connected
            database_module.db = original_db
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture
async def auth_user(mock_db: object) -> dict:
    """Insert a test user into the mock DB and return their public record.

    Returns:
        Dict with keys ``id`` (str ObjectId) and ``email``.
    """
    from datetime import datetime, timezone

    from bson import ObjectId

    from app.auth import hash_password

    user_id = ObjectId()
    now = datetime.now(timezone.utc)
    await mock_db.users.insert_one(
        {
            "_id": user_id,
            "email": "test@example.com",
            "password_hash": hash_password("password123"),
            "name": "Tester",
            "created_at": now,
            "updated_at": now,
        }
    )
    return {"id": str(user_id), "email": "test@example.com"}


@pytest_asyncio.fixture
async def auth_token(auth_user: dict) -> str:
    """Return a bearer JWT for the seeded test user.

    Returns:
        Encoded JWT string.
    """
    return create_token(auth_user["id"], auth_user["email"])


@pytest.fixture
def auth_headers(auth_token: str) -> dict[str, str]:
    """Return an Authorization header dict for authenticated requests.

    Returns:
        Dict with a single ``Authorization: Bearer <token>`` entry.
    """
    return {"Authorization": f"Bearer {auth_token}"}
