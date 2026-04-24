import os
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse

from app.database import get_db
from app.models import AssetResponse

asset_router = APIRouter(prefix="/assets", tags=["Assets"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/webp", "image/svg+xml",
    "image/gif", "image/bmp", "image/tiff",
}

os.makedirs(UPLOAD_DIR, exist_ok=True)


@asset_router.post("/upload", response_model=AssetResponse)
async def upload_asset(
    file: UploadFile = File(...),
    project_id: str = Query(default=None),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    # Save file to disk
    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    disk_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, disk_filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Save metadata to DB
    db = get_db()
    now = datetime.now(timezone.utc)

    doc = {
        "filename": file.filename,
        "disk_filename": disk_filename,
        "content_type": file.content_type,
        "size": len(contents),
        "project_id": project_id,
        "created_at": now,
    }

    result = await db.assets.insert_one(doc)
    asset_id = str(result.inserted_id)

    return AssetResponse(
        id=asset_id,
        filename=file.filename or "image",
        content_type=file.content_type or "image/png",
        size=len(contents),
        project_id=project_id,
        created_at=now,
        url=f"/api/assets/{asset_id}",
    )


@asset_router.get("/{asset_id}")
async def get_asset(asset_id: str):
    db = get_db()

    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    doc = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Asset not found")

    filepath = os.path.join(UPLOAD_DIR, doc["disk_filename"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        filepath,
        media_type=doc.get("content_type", "application/octet-stream"),
        filename=doc.get("filename", "image"),
    )


@asset_router.delete("/{asset_id}")
async def delete_asset(asset_id: str):
    db = get_db()

    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    doc = await db.assets.find_one_and_delete({"_id": ObjectId(asset_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Remove file from disk
    filepath = os.path.join(UPLOAD_DIR, doc["disk_filename"])
    if os.path.exists(filepath):
        os.remove(filepath)

    return {"status": "deleted", "id": asset_id}


@asset_router.get("", response_model=list[AssetResponse])
async def list_assets(project_id: str = Query(default=None)):
    db = get_db()

    query = {}
    if project_id:
        query["project_id"] = project_id

    cursor = db.assets.find(query).sort("created_at", -1).limit(100)

    assets = []
    async for doc in cursor:
        aid = str(doc["_id"])
        assets.append(AssetResponse(
            id=aid,
            filename=doc.get("filename", "image"),
            content_type=doc.get("content_type", "image/png"),
            size=doc.get("size", 0),
            project_id=doc.get("project_id"),
            created_at=doc.get("created_at", datetime.now(timezone.utc)),
            url=f"/api/assets/{aid}",
        ))

    return assets
