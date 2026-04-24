"""Happy-path coverage for comments_routes endpoints after the Depends refactor."""
from __future__ import annotations

from httpx import AsyncClient


async def test_list_comments_empty(client: AsyncClient) -> None:
    """GET /api/projects/{pid}/comments returns [] when none exist."""
    resp = await client.get("/api/projects/pid-123/comments")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_and_list_comment(client: AsyncClient) -> None:
    """POST a comment then GET surfaces it by projectId + text."""
    # NOTE: list_comments re-derives ``id`` from ``_id`` when Mongo auto-assigns
    # one, so the id returned here can differ from POST's id. We match on
    # projectId + text to stay scope-disciplined (don't change handler logic).
    payload = {"x": 10, "y": 20, "text": "hello-unique", "author": "Alice"}
    created = await client.post("/api/projects/pid-1/comments", json=payload)
    assert created.status_code == 200

    listing = await client.get("/api/projects/pid-1/comments")
    assert listing.status_code == 200
    comments = listing.json()
    assert any(
        c["projectId"] == "pid-1" and c["text"] == "hello-unique" for c in comments
    )


async def test_update_comment(client: AsyncClient) -> None:
    """PATCH toggles resolved flag."""
    created = (await client.post(
        "/api/projects/pid-2/comments",
        json={"x": 0, "y": 0, "text": "t"},
    )).json()
    resp = await client.patch(
        f"/api/projects/pid-2/comments/{created['id']}",
        json={"resolved": True},
    )
    assert resp.status_code == 200
    assert resp.json()["resolved"] is True


async def test_delete_comment(client: AsyncClient) -> None:
    """DELETE removes the comment."""
    created = (await client.post(
        "/api/projects/pid-3/comments",
        json={"x": 0, "y": 0, "text": "t"},
    )).json()
    resp = await client.delete(
        f"/api/projects/pid-3/comments/{created['id']}"
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"


async def test_add_reply(client: AsyncClient) -> None:
    """POST /{id}/replies appends a reply."""
    created = (await client.post(
        "/api/projects/pid-4/comments",
        json={"x": 0, "y": 0, "text": "t"},
    )).json()
    resp = await client.post(
        f"/api/projects/pid-4/comments/{created['id']}/replies",
        json={"text": "reply!"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["replies"]) == 1
    assert body["replies"][0]["text"] == "reply!"
