from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db, is_connected
from app.auth import get_current_user
from app.models import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
)

project_router = APIRouter(prefix="/projects", tags=["Projects"])


def _doc_to_response(doc: dict, detail: bool = False) -> dict:
    """Convert MongoDB document to response dict."""
    data = {
        "id": str(doc["_id"]),
        "name": doc.get("name", "Untitled"),
        "width": doc.get("width", 1000),
        "height": doc.get("height", 1000),
        "thumbnail": doc.get("thumbnail"),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
        "updated_at": doc.get("updated_at", datetime.now(timezone.utc)),
    }
    if detail:
        data["canvas_json"] = doc.get("canvas_json")
    return data


@project_router.post("", response_model=ProjectDetailResponse)
async def create_project(body: ProjectCreate, current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()
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
    }

    result = await db.projects.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_response(doc, detail=True)


@project_router.get("", response_model=list[ProjectResponse])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[dict] = Depends(get_current_user),
):
    # Gracefully degrade when DB is offline — frontend falls back to localStorage
    if not is_connected():
        return []

    db = get_db()

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
async def get_project(project_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()

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
    current_user: Optional[dict] = Depends(get_current_user),
):
    db = get_db()

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
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.projects.find_one_and_update(
        {"_id": ObjectId(project_id)},
        {"$set": update_data},
        return_document=True,
    )

    return _doc_to_response(result, detail=True)


@project_router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()

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
async def list_versions(project_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    """List all version snapshots for a project (newest first)."""
    db = get_db()

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
    note: Optional[str] = None,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Snapshot the current canvas state as a new version."""
    db = get_db()

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
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Restore a project to a specific version's state."""
    db = get_db()

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
async def create_share_link(project_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    """Generate or return existing share token for read-only access."""
    import secrets

    db = get_db()

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
async def revoke_share_link(project_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    db = get_db()

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
async def get_shared_project(share_token: str):
    db = get_db()

    doc = await db.projects.find_one({"share_token": share_token})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared project not found")

    return _doc_to_response(doc, detail=True)
