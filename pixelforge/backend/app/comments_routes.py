"""Comments API: per-project annotation threads."""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user
from app.database import get_db, is_connected

comments_router = APIRouter(prefix="/projects/{project_id}/comments", tags=["Comments"])


class Reply(BaseModel):
    id: str
    text: str
    author: str
    createdAt: str


class Comment(BaseModel):
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
    x: float
    y: float
    text: str
    author: Optional[str] = "Guest"


class CommentUpdate(BaseModel):
    text: Optional[str] = None
    resolved: Optional[bool] = None


class ReplyCreate(BaseModel):
    text: str
    author: Optional[str] = "Guest"


@comments_router.get("", response_model=list[Comment])
async def list_comments(project_id: str):
    if not is_connected():
        return []

    db = get_db()
    cursor = db.comments.find({"projectId": project_id})
    return [Comment(**{**doc, "id": str(doc["_id"]) if "_id" in doc else doc["id"]}) async for doc in cursor]


@comments_router.post("", response_model=Comment)
async def create_comment(project_id: str, body: CommentCreate, current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()
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
async def update_comment(project_id: str, comment_id: str, body: CommentUpdate):
    db = get_db()
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
async def delete_comment(project_id: str, comment_id: str):
    db = get_db()
    result = await db.comments.delete_one({"id": comment_id, "projectId": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"status": "deleted"}


@comments_router.post("/{comment_id}/replies", response_model=Comment)
async def add_reply(project_id: str, comment_id: str, body: ReplyCreate, current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()
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
