"""Asset upload / retrieval / deletion endpoints.

Assets are stored on-disk under ``UPLOAD_DIR`` with metadata in MongoDB.
All DB handles arrive via FastAPI's ``Depends(get_db)`` pattern.

SVG uploads undergo a defense-in-depth re-parse with ``defusedxml`` so that
malicious payloads (``<script>``, external ``xlink:href``) that survived the
frontend DOMPurify pass are rejected at the edge. See PX-003 AC-7.
"""
from __future__ import annotations

import os
import re
import uuid
from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from defusedxml import ElementTree as DefusedET  # type: ignore[import-untyped]
from defusedxml.common import DefusedXmlException  # type: ignore[import-untyped]
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.models import AssetResponse

asset_router = APIRouter(prefix="/assets", tags=["Assets"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_TYPES = {
    "image/png", "image/jpeg", "image/webp", "image/svg+xml",
    "image/gif", "image/bmp", "image/tiff",
}

# WHY: relative refs (``#id``, ``./foo``, ``/local/path``) are allowed; any
# scheme-bearing reference (http, https, data, file, javascript, ftp…) is
# treated as external and rejected. See PX-003 AC-7 / ARD §14.
_EXTERNAL_REF_RE = re.compile(r"^\s*[a-zA-Z][a-zA-Z0-9+.\-]*:", re.IGNORECASE)

os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_svg_bytes(data: bytes) -> None:
    """Re-parse an SVG payload and reject it if it contains unsafe constructs.

    Args:
        data: Raw bytes of an uploaded SVG file.

    Raises:
        HTTPException: 400 if the SVG is malformed, contains a ``<script>``
            element, a ``<foreignObject>`` element, or any ``href`` /
            ``xlink:href`` pointing to an external URL (i.e. anything with a
            URL scheme — ``http:``, ``https:``, ``data:``, ``file:``, etc.).

    Example:
        >>> validate_svg_bytes(b'<svg xmlns="http://www.w3.org/2000/svg"/>')
        >>> validate_svg_bytes(b'<svg><script/></svg>')
        Traceback (most recent call last):
        ...
        fastapi.exceptions.HTTPException: 400 ...
    """
    try:
        root = DefusedET.fromstring(data)
    except (DefusedXmlException, DefusedET.ParseError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Malformed or unsafe SVG: {exc.__class__.__name__}",
        ) from exc

    # Walk every element in the tree. Strip namespaces on tag lookups so we
    # match ``<script>`` whether or not it carries an xmlns prefix.
    for el in root.iter():
        tag = el.tag.split("}", 1)[-1] if "}" in el.tag else el.tag
        if tag in {"script", "foreignObject"}:
            raise HTTPException(
                status_code=400,
                detail=f"SVG contains disallowed <{tag}> element",
            )
        for attr_name, attr_val in el.attrib.items():
            local = attr_name.split("}", 1)[-1] if "}" in attr_name else attr_name
            if local in {"href", "xlink:href"} or local.endswith("href"):
                if _EXTERNAL_REF_RE.match(attr_val):
                    raise HTTPException(
                        status_code=400,
                        detail="SVG contains external href reference",
                    )
            # WHY: event-handler attrs (onload, onerror, onclick, on*…) must
            # never reach persistence — DOMPurify strips them on the FE but
            # we re-check here as defense-in-depth.
            if local.lower().startswith("on"):
                raise HTTPException(
                    status_code=400,
                    detail=f"SVG contains event-handler attribute: {local}",
                )


@asset_router.post("/upload", response_model=AssetResponse)
async def upload_asset(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    file: UploadFile = File(...),
    project_id: str = Query(default=None),
):
    """Upload an image asset, persist to disk, record metadata in Mongo.

    Args:
        db: Async Mongo database handle.
        file: Uploaded file (must match ``ALLOWED_TYPES``).
        project_id: Optional project to associate this asset with.

    Returns:
        ``AssetResponse`` with the persisted asset's metadata and URL.

    Raises:
        HTTPException: 400 for unsupported type or oversize payload.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    # WHY: SVG uploads are XML and can smuggle XSS. Re-parse defensively.
    if file.content_type == "image/svg+xml":
        validate_svg_bytes(contents)

    # Save file to disk
    ext = os.path.splitext(file.filename or "image.png")[1] or ".png"
    disk_filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, disk_filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Save metadata to DB
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
async def get_asset(
    asset_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Stream an asset's bytes from disk.

    Args:
        asset_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.

    Returns:
        ``FileResponse`` streaming the file with its recorded content-type.

    Raises:
        HTTPException: 400 invalid id, 404 missing record or file.
    """
    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")

    doc = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Asset not found")

    filepath = os.path.join(UPLOAD_DIR, doc["disk_filename"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found on disk")

    # PX-143 — `private, no-cache` lets browsers reuse the bytes only after
    # revalidating with the existing ETag, and (critically) prevents a
    # cached non-CORS response from being silently reused for a later
    # CORS-mode request from canvas / fabric. The next request will
    # round-trip and pick up the current Access-Control-Allow-Origin
    # headers correctly. ETag still gives 304s on unchanged assets so the
    # bandwidth impact is negligible.
    return FileResponse(
        filepath,
        media_type=doc.get("content_type", "application/octet-stream"),
        filename=doc.get("filename", "image"),
        headers={"Cache-Control": "private, no-cache"},
    )


@asset_router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Delete an asset record and its on-disk file.

    Args:
        asset_id: MongoDB ObjectId as a string.
        db: Async Mongo database handle.

    Returns:
        Dict ``{"status": "deleted", "id": asset_id}``.

    Raises:
        HTTPException: 400 invalid id, 404 missing record.
    """
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
async def list_assets(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    project_id: str = Query(default=None),
):
    """List assets, optionally scoped to a project.

    Args:
        db: Async Mongo database handle.
        project_id: Optional project id filter.

    Returns:
        Up to 100 ``AssetResponse`` entries, newest first.
    """
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
