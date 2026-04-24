"""Smoke test: confirm the FastAPI test harness boots and /health answers."""
from __future__ import annotations

from httpx import AsyncClient


async def test_health_endpoint_returns_200(client: AsyncClient) -> None:
    """/health returns 200 with the expected service identifier."""
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert body["service"] == "pixelforge-api"
    # With the mock_db fixture active, is_connected() is flipped True
    assert body["database"] == "connected"
