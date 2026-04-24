"""Authentication endpoints: signup, login, current-user lookup."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import (
    AuthResponse,
    UserLogin,
    UserPublic,
    UserSignup,
    create_token,
    hash_password,
    require_user,
    verify_password,
)
from app.database import get_db

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_to_public(doc: dict) -> UserPublic:
    """Project an internal user document to the public-safe shape.

    Args:
        doc: Mongo user document including ``_id`` and ``email``.

    Returns:
        A ``UserPublic`` suitable for returning over the wire.
    """
    return UserPublic(
        id=str(doc["_id"]),
        email=doc["email"],
        name=doc.get("name"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
    )


@auth_router.post("/signup", response_model=AuthResponse)
async def signup(
    body: UserSignup,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Create a new user account and return a signed JWT.

    Args:
        body: ``UserSignup`` payload (email, password, optional name).
        db: Async Mongo database handle.

    Returns:
        ``AuthResponse`` with token and public user record.

    Raises:
        HTTPException: 409 if email registered, 400 if password too short.
    """
    # Check if user exists
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    now = datetime.now(timezone.utc)
    doc = {
        "email": body.email.lower(),
        "password_hash": hash_password(body.password),
        "name": body.name or body.email.split("@")[0],
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    user = _user_to_public(doc)
    token = create_token(user.id, user.email)

    return AuthResponse(token=token, user=user)


@auth_router.post("/login", response_model=AuthResponse)
async def login(
    body: UserLogin,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Authenticate an existing user and return a signed JWT.

    Args:
        body: ``UserLogin`` payload (email, password).
        db: Async Mongo database handle.

    Returns:
        ``AuthResponse`` with token and public user record.

    Raises:
        HTTPException: 401 for unknown email or bad password.
    """
    doc = await db.users.find_one({"email": body.email.lower()})
    if not doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(body.password, doc["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = _user_to_public(doc)
    token = create_token(user.id, user.email)

    return AuthResponse(token=token, user=user)


@auth_router.get("/me", response_model=UserPublic)
async def get_me(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
):
    """Return the authenticated caller's public user record.

    Args:
        db: Async Mongo database handle.
        current_user: Decoded JWT claims (required).

    Returns:
        ``UserPublic`` for the caller.

    Raises:
        HTTPException: 404 if the user record no longer exists.
    """
    doc = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_public(doc)
