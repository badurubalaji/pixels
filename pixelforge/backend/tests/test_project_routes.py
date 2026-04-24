"""Happy-path coverage for project_routes endpoints after the Depends refactor.

One test per refactored handler exercises the Depends(get_db) wire-up end-to-end.
"""
from __future__ import annotations

from httpx import AsyncClient


async def test_create_project_anonymous(client: AsyncClient) -> None:
    """POST /api/projects creates a project with anonymous owner."""
    resp = await client.post(
        "/api/projects",
        json={"name": "My Canvas", "width": 800, "height": 600},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "My Canvas"
    assert body["width"] == 800
    assert body["height"] == 600
    assert "id" in body


async def test_list_projects_returns_created(client: AsyncClient) -> None:
    """GET /api/projects returns previously created anonymous projects."""
    await client.post("/api/projects", json={"name": "A"})
    await client.post("/api/projects", json={"name": "B"})
    resp = await client.get("/api/projects")
    assert resp.status_code == 200
    names = {p["name"] for p in resp.json()}
    assert {"A", "B"}.issubset(names)


async def test_get_project_by_id(client: AsyncClient) -> None:
    """GET /api/projects/{id} returns detail view."""
    created = (await client.post("/api/projects", json={"name": "Detail"})).json()
    resp = await client.get(f"/api/projects/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


async def test_update_project(client: AsyncClient) -> None:
    """PUT /api/projects/{id} updates name."""
    created = (await client.post("/api/projects", json={"name": "Old"})).json()
    resp = await client.put(f"/api/projects/{created['id']}", json={"name": "New"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


async def test_delete_project(client: AsyncClient) -> None:
    """DELETE /api/projects/{id} removes the project."""
    created = (await client.post("/api/projects", json={"name": "Doomed"})).json()
    resp = await client.delete(f"/api/projects/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"


async def test_list_versions_empty(client: AsyncClient) -> None:
    """GET /api/projects/{id}/versions returns empty list for new project."""
    created = (await client.post("/api/projects", json={"name": "V"})).json()
    resp = await client.get(f"/api/projects/{created['id']}/versions")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_version(client: AsyncClient) -> None:
    """POST /api/projects/{id}/versions snapshots canvas state."""
    created = (await client.post(
        "/api/projects",
        json={"name": "V", "canvas_json": '{"objects":[]}'},
    )).json()
    resp = await client.post(f"/api/projects/{created['id']}/versions")
    assert resp.status_code == 200
    assert resp.json()["project_id"] == created["id"]


async def test_restore_version(client: AsyncClient) -> None:
    """POST /api/projects/{id}/versions/{vid}/restore swaps canvas state."""
    created = (await client.post(
        "/api/projects",
        json={"name": "V", "canvas_json": '{"v":1}'},
    )).json()
    version = (await client.post(f"/api/projects/{created['id']}/versions")).json()
    # Update project, then restore
    await client.put(f"/api/projects/{created['id']}", json={"canvas_json": '{"v":2}'})
    resp = await client.post(
        f"/api/projects/{created['id']}/versions/{version['id']}/restore"
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "restored"


async def test_create_and_revoke_share_link(client: AsyncClient) -> None:
    """POST and DELETE /api/projects/{id}/share manages share tokens."""
    created = (await client.post("/api/projects", json={"name": "Share"})).json()
    share = await client.post(f"/api/projects/{created['id']}/share")
    assert share.status_code == 200
    token = share.json()["share_token"]
    assert token

    revoke = await client.delete(f"/api/projects/{created['id']}/share")
    assert revoke.status_code == 200
    assert revoke.json()["status"] == "revoked"


async def test_get_shared_project(client: AsyncClient) -> None:
    """GET /api/projects/shared/{token} returns the project via share token."""
    created = (await client.post("/api/projects", json={"name": "Shared"})).json()
    share = (await client.post(f"/api/projects/{created['id']}/share")).json()
    resp = await client.get(f"/api/projects/shared/{share['share_token']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]
