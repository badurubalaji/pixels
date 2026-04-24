"""Project CRUD, versioning, and share-link API endpoints.

All handlers receive the MongoDB handle via FastAPI's ``Depends(get_db)``
pattern (§5.1 project-context.md) so dependency-injection, testing, and
OpenAPI stay idiomatic.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import get_current_user
from app.database import get_db, is_connected
from app.models import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)

project_router = APIRouter(prefix="/projects", tags=["Projects"])


def _doc_to_response(doc: dict, detail: bool = False) -> dict:
    """Convert a MongoDB project document to the API response shape.

    Args:
        doc: Raw project document from MongoDB (includes ``_id``).
        detail: When True, include the full ``canvas_json`` payload.

    Returns:
        A dict matching ``ProjectResponse`` (or ``ProjectDetailResponse`` when
        ``detail`` is True).
    """
    data = {
        "id": str(doc["_id"]),
        "name": doc.get("name", "Untitled"),
        "width": doc.get("width", 1000),
        "height": doc.get("height", 1000),
        "thumbnail": doc.get("thumbnail"),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
        "updated_at": doc.get("updated_at", datetime.now(timezone.utc)),
        # PX-060 T-0 — Brand-Kit auto-apply traceability fields. All optional;
        # legacy rows (pre-migration) will return None for platform until the
        # 0001_projects_platform_backfill migration has run.
        "source_template_id": doc.get("source_template_id"),
        "brand_kit_applied_at": doc.get("brand_kit_applied_at"),
        "platform": doc.get("platform"),
    }
    if detail:
        data["canvas_json"] = doc.get("canvas_json")
    return data


@project_router.post("", response_model=ProjectDetailResponse)
async def create_project(
    body: ProjectCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Create a new project owned by the current user (or anonymous).

    Args:
        body: Project creation payload (name, dimensions, canvas_json, thumbnail).
        db: Async Mongo database handle injected by FastAPI.
        current_user: Optional authenticated user dict; anonymous if None.

    Returns:
        The newly-created project as ``ProjectDetailResponse``.
    """
    now = datetime.now(timezone.utc)

    doc = {
        "name": body.name,
        "width": body.width,
        "height": body.height,
        "canvas_json": body.canvas_json,
        "thumbnail": body.thumbnail,
        "created_at": now,
        "updated_at": now,
        "user_id": current_user["id"] if current_user else None,
        # PX-060 T-0 — persist template-origin + Brand-Kit auto-apply marker.
        "source_template_id": body.source_template_id,
        "brand_kit_applied_at": body.brand_kit_applied_at,
        "platform": body.platform,
    }

    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_response(doc, detail=True)


@project_router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List projects visible to the current user, newest first.

    Args:
        db: Async Mongo database handle.
        skip: Pagination offset (defaults to 0).
        limit: Maximum projects to return (1-100, defaults to 50).
        current_user: Optional authenticated user dict.

    Returns:
        List of ``ProjectResponse`` entries (empty list if DB offline).
    """
    # Gracefully degrade when DB is offline — frontend falls back to localStorage
    if not is_connected():
        return []

    # Scope to user if authenticated, else anonymous projects
    query = {"user_id": current_user["id"]} if current_user else {"user_id": None}

    cursor = db.projects.find(
        query,
        {"canvas_json": 0},
    ).sort("updated_at", -1).skip(skip).limit(limit)

    projects = []
    async for doc in cursor:
        projects.append(_doc_to_response(doc))
    return projects


@project_router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Fetch a single project by ID, honoring ownership and share tokens.

    Args:
        project_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict.

    Returns:
        Full ``ProjectDetailResponse`` including canvas_json.

    Raises:
        HTTPException: 400 if id invalid, 404 if missing, 403 if access denied.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    doc = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check ownership
    owner_id = doc.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id and not doc.get("share_token"):
        raise HTTPException(status_code=403, detail="Access denied")

    return _doc_to_response(doc, detail=True)


@project_router.put("/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Apply partial updates to an owned project.

    Args:
        project_id: MongoDB ObjectId as a string.
        body: Partial update payload; only set fields are applied.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        The updated project as ``ProjectDetailResponse``.

    Raises:
        HTTPException: 400 invalid id, 404 missing, 403 not owner.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    # Verify ownership
    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = body.model_dump(exclude_none=True)
    # PX-060 T-0 — allow clients to *explicitly* clear ``brand_kit_applied_at``
    # by sending it as null in the PUT body (editor Undo uses this to mark the
    # project as reverted). ``exclude_none=True`` drops such nulls, so we
    # re-introduce the field when it was explicitly set to None by the caller.
    if "brand_kit_applied_at" in body.model_fields_set and body.brand_kit_applied_at is None:
        update_data["brand_kit_applied_at"] = None
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.projects.find_one_and_update(
        {"_id": ObjectId(project_id)},
        {"$set": update_data},
        return_document=True,
    )

    return _doc_to_response(result, detail=True)


@project_router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Delete an owned project and its associated assets.

    Args:
        project_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        Dict ``{"status": "deleted", "id": project_id}``.

    Raises:
        HTTPException: 400 invalid id, 404 missing, 403 not owner.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    # Verify ownership
    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.projects.delete_one({"_id": ObjectId(project_id)})
    await db.assets.delete_many({"project_id": project_id})

    return {"status": "deleted", "id": project_id}


@project_router.get("/{project_id}/versions")
async def list_versions(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """List all version snapshots for a project (newest first, capped at 20).

    Args:
        project_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        List of version summary dicts.

    Raises:
        HTTPException: 400 invalid id, 404 missing, 403 not owner.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    cursor = db.versions.find(
        {"project_id": project_id},
        {"canvas_json": 0},
    ).sort("created_at", -1).limit(20)

    versions = []
    async for doc in cursor:
        versions.append({
            "id": str(doc["_id"]),
            "project_id": doc["project_id"],
            "thumbnail": doc.get("thumbnail"),
            "created_at": doc.get("created_at"),
            "note": doc.get("note"),
        })

    return versions


@project_router.post("/{project_id}/versions")
async def create_version(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    note: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Snapshot the current canvas state as a new version.

    Args:
        project_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.
        note: Optional caption describing this snapshot.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        Dict with the new version's ``id``, ``project_id``, ``created_at``.

    Raises:
        HTTPException: 400 invalid id or empty canvas, 404 missing, 403 not owner.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not existing.get("canvas_json"):
        raise HTTPException(status_code=400, detail="No canvas state to snapshot")

    now = datetime.now(timezone.utc)
    version_doc = {
        "project_id": project_id,
        "canvas_json": existing.get("canvas_json"),
        "thumbnail": existing.get("thumbnail"),
        "created_at": now,
        "note": note,
    }

    result = await db.versions.insert_one(version_doc)

    # Prune old versions - keep last 20
    existing_count = await db.versions.count_documents({"project_id": project_id})
    if existing_count > 20:
        cursor = db.versions.find(
            {"project_id": project_id},
            {"_id": 1},
        ).sort("created_at", 1).limit(existing_count - 20)

        ids_to_delete = [doc["_id"] async for doc in cursor]
        if ids_to_delete:
            await db.versions.delete_many({"_id": {"$in": ids_to_delete}})

    return {"id": str(result.inserted_id), "project_id": project_id, "created_at": now}


@project_router.post("/{project_id}/versions/{version_id}/restore")
async def restore_version(
    project_id: str,
    version_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Restore a project to a specific version's canvas state.

    Args:
        project_id: MongoDB ObjectId of the project.
        version_id: MongoDB ObjectId of the version to restore.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        Dict ``{"status": "restored"}``.

    Raises:
        HTTPException: 400 invalid ids, 404 missing project/version, 403 not owner.
    """
    if not ObjectId.is_valid(project_id) or not ObjectId.is_valid(version_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    version = await db.versions.find_one({"_id": ObjectId(version_id), "project_id": project_id})
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {
            "canvas_json": version["canvas_json"],
            "thumbnail": version.get("thumbnail"),
            "updated_at": datetime.now(timezone.utc),
        }},
    )

    return {"status": "restored"}


@project_router.post("/{project_id}/share")
async def create_share_link(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Generate or return an existing share token for read-only access.

    Args:
        project_id: MongoDB ObjectId of the project.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        Dict with ``share_token`` and ``project_id``.

    Raises:
        HTTPException: 400 invalid id, 404 missing, 403 not owner.
    """
    import secrets

    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    token = existing.get("share_token") or secrets.token_urlsafe(16)

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"share_token": token}},
    )

    return {"share_token": token, "project_id": project_id}


@project_router.delete("/{project_id}/share")
async def revoke_share_link(
    project_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Revoke the share token on a project, disabling public read access.

    Args:
        project_id: MongoDB ObjectId of the project.
        db: Async Mongo database handle.
        current_user: Optional authenticated user dict (owner check).

    Returns:
        Dict ``{"status": "revoked"}``.

    Raises:
        HTTPException: 400 invalid id, 404 missing, 403 not owner.
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")

    existing = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    owner_id = existing.get("user_id")
    current_id = current_user["id"] if current_user else None
    if owner_id != current_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$unset": {"share_token": ""}},
    )

    return {"status": "revoked"}


@project_router.get("/shared/{share_token}", response_model=ProjectDetailResponse)
async def get_shared_project(
    share_token: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Fetch a shared project by its public share token (read-only).

    Args:
        share_token: Opaque URL-safe share identifier.
        db: Async Mongo database handle.

    Returns:
        Full ``ProjectDetailResponse``.

    Raises:
        HTTPException: 404 if no project matches the token.
    """
    doc = await db.projects.find_one({"share_token": share_token})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared project not found")

    return _doc_to_response(doc, detail=True)
