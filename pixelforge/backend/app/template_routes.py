"""Public template gallery: community-shared templates anyone can clone.

This module also exposes the *seed starter templates* collection (ARD §8.1)
under ``/v1/templates`` with ``platform`` and ``tags`` filters (PX-022a).
The two endpoints read different collections on purpose:
``public_templates`` is user-generated content; ``templates`` is curated seed
data loaded by :mod:`app.seed.templates_seed`.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth import require_user
from app.database import get_db, is_connected

template_router = APIRouter(prefix="/public-templates", tags=["Public Templates"])

# Separate router for the seed/starter templates — different collection,
# different schema, different URL namespace (versioned under /v1/).
seed_template_router = APIRouter(prefix="/v1/templates", tags=["Seed Templates"])


class PublicTemplateCreate(BaseModel):
    """Payload for publishing a new public template.

    Attributes:
        name: Template display name.
        category: Taxonomy bucket (defaults to ``Other``).
        description: Optional long-form description.
        canvas_json: Serialized fabric.js canvas state.
        thumbnail: Optional data-URL thumbnail.
        width: Canvas width in pixels.
        height: Canvas height in pixels.
    """

    name: str
    category: str = "Other"
    description: Optional[str] = None
    canvas_json: str
    thumbnail: Optional[str] = None
    width: int
    height: int


class PublicTemplate(BaseModel):
    """Summary record for a public template (no canvas_json)."""

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
    """Full template record including the serialized canvas_json."""

    canvas_json: str


@template_router.get("", response_model=list[PublicTemplate])
async def list_public_templates(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List public templates, optionally filtered by category or search term.

    Args:
        db: Async Mongo database handle.
        category: Optional category filter (``all`` disables the filter).
        search: Optional case-insensitive substring match on template name.
        skip: Pagination offset.
        limit: Maximum entries to return (1-100).

    Returns:
        List of ``PublicTemplate`` summaries sorted by ``uses_count`` desc.
        Empty list when the DB is offline.
    """
    if not is_connected():
        return []

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
async def get_public_template(
    template_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Fetch a public template by id and bump its ``uses_count``.

    Args:
        template_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.

    Returns:
        Full ``PublicTemplateDetail`` including canvas_json.

    Raises:
        HTTPException: 400 invalid id, 404 missing.
    """
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
async def publish_template(
    body: PublicTemplateCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
):
    """Publish a new template to the public gallery.

    Args:
        body: Template creation payload.
        db: Async Mongo database handle.
        current_user: Authenticated user dict (required; becomes author).

    Returns:
        The newly-created ``PublicTemplateDetail``.
    """
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
async def delete_public_template(
    template_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
):
    """Delete a public template. Only the original author may delete.

    Args:
        template_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.
        current_user: Authenticated user dict (must match template author_id).

    Returns:
        Dict ``{"status": "deleted"}``.

    Raises:
        HTTPException: 400 invalid id, 404 missing, 403 not author.
    """
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
    """Project a MongoDB template document into the response shape.

    Args:
        doc: Raw template document from MongoDB.
        with_json: When True, include the ``canvas_json`` field.

    Returns:
        A plain dict matching ``PublicTemplate`` (or ``PublicTemplateDetail``).
    """
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


# ---------------------------------------------------------------------------
# Seed / starter templates (ARD §8.1) — PX-022a
# ---------------------------------------------------------------------------


@seed_template_router.get("")
async def list_seed_templates(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    platform: Optional[str] = Query(
        default=None,
        description="Filter by platform id (e.g. ``ig-post``).",
    ),
    tags: Optional[str] = Query(
        default=None,
        description=(
            "Comma-separated tag list. A template matches when *any* of the "
            "supplied tags intersects its ``tags`` array (OR semantics)."
        ),
    ),
) -> list[dict[str, Any]]:
    """List seed starter templates, optionally filtered by platform and tags.

    Args:
        db: Async Mongo database handle (injected via ``Depends(get_db)``).
        platform: Optional platform id filter. When supplied, only templates
            with an exact ``platform`` match are returned.
        tags: Optional comma-separated tag list. Uses OR semantics — a
            template is returned if any of its tags appears in the request.

    Returns:
        List of raw template documents (with ``_id`` stringified). Empty list
        when the DB is offline or no rows match the filter.
    """
    if not is_connected():
        return []

    query: dict[str, Any] = {"is_template": True}
    if platform:
        query["platform"] = platform
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            query["tags"] = {"$in": tag_list}

    cursor = db.templates.find(query)
    results: list[dict[str, Any]] = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
