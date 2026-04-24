"""Comments API: per-project annotation threads with replies."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import get_db, is_connected

comments_router = APIRouter(prefix="/projects/{project_id}/comments", tags=["Comments"])


class Reply(BaseModel):
    """A single reply inside a comment thread."""

    id: str
    text: str
    author: str
    createdAt: str


class Comment(BaseModel):
    """A positional comment anchored to (x, y) on the project canvas."""

    id: str
    projectId: str
    x: float
    y: float
    text: str
    author: str
    createdAt: str
    resolved: bool = False
    replies: list[Reply] = []


class CommentCreate(BaseModel):
    """Payload for creating a new comment."""

    x: float
    y: float
    text: str
    author: Optional[str] = "Guest"


class CommentUpdate(BaseModel):
    """Partial update for an existing comment."""

    text: Optional[str] = None
    resolved: Optional[bool] = None


class ReplyCreate(BaseModel):
    """Payload for adding a reply to an existing comment."""

    text: str
    author: Optional[str] = "Guest"


@comments_router.get("", response_model=list[Comment])
async def list_comments(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """List all comments for a project.

    Args:
        project_id: Project identifier (string; not validated server-side here).
        db: Async Mongo database handle.

    Returns:
        List of ``Comment`` records (empty list if DB offline).
    """
    if not is_connected():
        return []

    cursor = db.comments.find({"projectId": project_id})
    return [Comment(**{**doc, "id": str(doc["_id"]) if "_id" in doc else doc["id"]}) async for doc in cursor]


@comments_router.post("", response_model=Comment)
async def create_comment(
    project_id: str,
    body: CommentCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Add a new positional comment to a project.

    Args:
        project_id: Target project identifier.
        body: Comment creation payload.
        db: Async Mongo database handle.
        current_user: Optional authenticated user; falls back to ``Guest``.

    Returns:
        The persisted ``Comment`` record.
    """
    comment_id = str(ObjectId())
    now = datetime.now(timezone.utc).isoformat()
    author = body.author or (current_user.get("email") if current_user else "Guest")

    doc = {
        "id": comment_id,
        "projectId": project_id,
        "x": body.x,
        "y": body.y,
        "text": body.text,
        "author": author,
        "createdAt": now,
        "resolved": False,
        "replies": [],
    }
    await db.comments.insert_one(doc)
    return Comment(**doc)


@comments_router.patch("/{comment_id}", response_model=Comment)
async def update_comment(
    project_id: str,
    comment_id: str,
    body: CommentUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Partially update a comment (text and/or resolved flag).

    Args:
        project_id: Owning project id.
        comment_id: Comment identifier.
        body: Partial update payload.
        db: Async Mongo database handle.

    Returns:
        The updated ``Comment`` record.

    Raises:
        HTTPException: 400 if payload empty, 404 if comment missing.
    """
    update_data = body.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No changes")

    doc = await db.comments.find_one_and_update(
        {"id": comment_id, "projectId": project_id},
        {"$set": update_data},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Comment not found")
    return Comment(**doc)


@comments_router.delete("/{comment_id}")
async def delete_comment(
    project_id: str,
    comment_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Delete a comment.

    Args:
        project_id: Owning project id.
        comment_id: Comment identifier.
        db: Async Mongo database handle.

    Returns:
        Dict ``{"status": "deleted"}``.

    Raises:
        HTTPException: 404 if the comment does not exist.
    """
    result = await db.comments.delete_one({"id": comment_id, "projectId": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"status": "deleted"}


@comments_router.post("/{comment_id}/replies", response_model=Comment)
async def add_reply(
    project_id: str,
    comment_id: str,
    body: ReplyCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Append a reply to an existing comment thread.

    Args:
        project_id: Owning project id.
        comment_id: Comment identifier.
        body: Reply payload.
        db: Async Mongo database handle.
        current_user: Optional authenticated user; falls back to ``Guest``.

    Returns:
        The updated ``Comment`` with the new reply appended.

    Raises:
        HTTPException: 404 if the parent comment is missing.
    """
    reply = {
        "id": str(ObjectId()),
        "text": body.text,
        "author": body.author or (current_user.get("email") if current_user else "Guest"),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    doc = await db.comments.find_one_and_update(
        {"id": comment_id, "projectId": project_id},
        {"$push": {"replies": reply}},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Comment not found")
    return Comment(**doc)
