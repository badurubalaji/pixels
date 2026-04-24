"""Public template gallery: community-shared templates anyone can clone."""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.auth import get_current_user, require_user
from app.database import get_db, is_connected

template_router = APIRouter(prefix="/public-templates", tags=["Public Templates"])


class PublicTemplateCreate(BaseModel):
    name: str
    category: str = "Other"
    description: Optional[str] = None
    canvas_json: str
    thumbnail: Optional[str] = None
    width: int
    height: int


class PublicTemplate(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    width: int
    height: int
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    uses_count: int = 0
    created_at: datetime


class PublicTemplateDetail(PublicTemplate):
    canvas_json: str


@template_router.get("", response_model=list[PublicTemplate])
async def list_public_templates(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    if not is_connected():
        return []

    db = get_db()
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    cursor = db.public_templates.find(query, {"canvas_json": 0}).sort("uses_count", -1).skip(skip).limit(limit)

    templates = []
    async for doc in cursor:
        templates.append(_doc_to_response(doc))
    return templates


@template_router.get("/{template_id}", response_model=PublicTemplateDetail)
async def get_public_template(template_id: str):
    db = get_db()
    if not ObjectId.is_valid(template_id):
        raise HTTPException(status_code=400, detail="Invalid template ID")

    doc = await db.public_templates.find_one({"_id": ObjectId(template_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")

    # Increment uses count
    await db.public_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$inc": {"uses_count": 1}},
    )

    return _doc_to_response(doc, with_json=True)


@template_router.post("", response_model=PublicTemplateDetail)
async def publish_template(body: PublicTemplateCreate, current_user: dict = Depends(require_user)):
    db = get_db()

    # Get author name from users collection
    user_doc = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    author_name = user_doc.get("name") if user_doc else current_user.get("email", "Anonymous")

    now = datetime.now(timezone.utc)
    doc = {
        "name": body.name,
        "category": body.category,
        "description": body.description,
        "canvas_json": body.canvas_json,
        "thumbnail": body.thumbnail,
        "width": body.width,
        "height": body.height,
        "author_id": current_user["id"],
        "author_name": author_name,
        "uses_count": 0,
        "created_at": now,
    }
    result = await db.public_templates.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_response(doc, with_json=True)


@template_router.delete("/{template_id}")
async def delete_public_template(template_id: str, current_user: dict = Depends(require_user)):
    db = get_db()
    if not ObjectId.is_valid(template_id):
        raise HTTPException(status_code=400, detail="Invalid template ID")

    existing = await db.public_templates.find_one({"_id": ObjectId(template_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")

    if existing.get("author_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only the author can delete this template")

    await db.public_templates.delete_one({"_id": ObjectId(template_id)})
    return {"status": "deleted"}


def _doc_to_response(doc: dict, with_json: bool = False) -> dict:
    data = {
        "id": str(doc["_id"]),
        "name": doc.get("name", "Untitled"),
        "category": doc.get("category", "Other"),
        "description": doc.get("description"),
        "thumbnail": doc.get("thumbnail"),
        "width": doc.get("width", 1000),
        "height": doc.get("height", 1000),
        "author_id": doc.get("author_id"),
        "author_name": doc.get("author_name"),
        "uses_count": doc.get("uses_count", 0),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
    }
    if with_json:
        data["canvas_json"] = doc.get("canvas_json", "{}")
    return data
