"""Brand kit API: per-user saved colors, fonts, logos."""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import require_user
from app.database import get_db, is_connected

brand_router = APIRouter(prefix="/brand-kit", tags=["Brand Kit"])


class BrandLogo(BaseModel):
    id: str
    name: str
    dataUrl: str


class BrandKit(BaseModel):
    colors: list[str] = []
    fonts: list[str] = []
    logos: list[BrandLogo] = []


@brand_router.get("", response_model=BrandKit)
async def get_brand_kit(current_user: dict = Depends(require_user)):
    if not is_connected():
        return BrandKit()
    db = get_db()
    doc = await db.brand_kits.find_one({"user_id": current_user["id"]})
    if not doc:
        return BrandKit()
    return BrandKit(
        colors=doc.get("colors", []),
        fonts=doc.get("fonts", []),
        logos=[BrandLogo(**l) for l in doc.get("logos", [])],
    )


@brand_router.put("", response_model=BrandKit)
async def update_brand_kit(body: BrandKit, current_user: dict = Depends(require_user)):
    db = get_db()
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
