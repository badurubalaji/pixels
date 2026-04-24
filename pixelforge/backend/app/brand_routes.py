"""Brand kit API: per-user saved colors, fonts, and logos."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth import require_user
from app.database import get_db, is_connected

brand_router = APIRouter(prefix="/brand-kit", tags=["Brand Kit"])


class BrandLogo(BaseModel):
    """A single logo entry stored in a brand kit.

    Attributes:
        id: Stable client-side identifier for the logo.
        name: Human-readable label shown in the UI.
        dataUrl: Base64-encoded image payload (``data:image/...``).
    """

    id: str
    name: str
    dataUrl: str


class BrandKit(BaseModel):
    """Collection of reusable brand primitives per user.

    Attributes:
        colors: Hex color strings.
        fonts: Font family names.
        logos: Saved logo entries.
    """

    colors: list[str] = []
    fonts: list[str] = []
    logos: list[BrandLogo] = []


@brand_router.get("", response_model=BrandKit)
async def get_brand_kit(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
):
    """Return the authenticated user's brand kit.

    Args:
        db: Async Mongo database handle.
        current_user: Authenticated user dict (required).

    Returns:
        The user's ``BrandKit`` (empty if no record exists or DB offline).
    """
    if not is_connected():
        return BrandKit()
    doc = await db.brand_kits.find_one({"user_id": current_user["id"]})
    if not doc:
        return BrandKit()
    return BrandKit(
        colors=doc.get("colors", []),
        fonts=doc.get("fonts", []),
        logos=[BrandLogo(**l) for l in doc.get("logos", [])],
    )


@brand_router.put("", response_model=BrandKit)
async def update_brand_kit(
    body: BrandKit,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
):
    """Upsert the authenticated user's brand kit.

    Args:
        body: Full ``BrandKit`` payload that replaces existing fields.
        db: Async Mongo database handle.
        current_user: Authenticated user dict (required).

    Returns:
        The persisted ``BrandKit`` (echoes the request body).
    """
    now = datetime.now(timezone.utc)

    await db.brand_kits.update_one(
        {"user_id": current_user["id"]},
        {
            "$set": {
                "colors": body.colors,
                "fonts": body.fonts,
                "logos": [l.model_dump() for l in body.logos],
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": current_user["id"],
                "created_at": now,
            },
        },
        upsert=True,
    )
    return body
