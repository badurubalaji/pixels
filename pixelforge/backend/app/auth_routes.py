"""Authentication endpoints: signup, login, current-user lookup."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth import (
    AuthResponse,
    PasswordChange,
    UserLogin,
    UserPublic,
    UserSignup,
    UserUpdate,
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


@auth_router.patch("/me", response_model=UserPublic)
async def update_me(
    body: UserUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
):
    """Partially update the authenticated caller's own profile (PX-071).

    Args:
        body: ``UserUpdate`` partial payload. Currently only ``name`` is
            writable. A ``null`` or empty name clears the field (display
            falls back to the email local-part).
        db: Async Mongo database handle.
        current_user: Decoded JWT claims (required).

    Returns:
        ``UserPublic`` reflecting the post-update state.

    Raises:
        HTTPException: 404 if the user record has been deleted mid-session,
            400 if the submitted name exceeds 60 characters.

    Example:
        >>> # PATCH /api/auth/me
        >>> # Authorization: Bearer <jwt>
        >>> # {"name": "Jane Bloggs"}

    @see Story PX-071
    """
    user_oid = ObjectId(current_user["id"])

    # Build a minimal $set so we never overwrite fields the client did not
    # send. The UserUpdate schema only surfaces ``name`` today; future
    # fields (e.g. display_tz, avatar_url) go through the same pattern.
    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}
    payload = body.model_dump(exclude_unset=True)
    if "name" in payload:
        raw = payload["name"]
        normalized = raw.strip() if isinstance(raw, str) else None
        if normalized and len(normalized) > 60:
            raise HTTPException(
                status_code=400, detail="Display name must be 60 characters or fewer"
            )
        # WHY: store empty string as None so the display fallback to email
        # local-part behaves uniformly across read paths.
        update_fields["name"] = normalized or None

    result = await db.users.find_one_and_update(
        {"_id": user_oid},
        {"$set": update_fields},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return _user_to_public(result)


@auth_router.post("/me/password")
async def change_password(
    body: PasswordChange,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: dict = Depends(require_user),
) -> Response:
    """Rotate the authenticated caller's password (PX-075).

    Args:
        body: ``PasswordChange`` with ``current`` (must match the stored
            hash) and ``next`` (≥ 6 characters).
        db: Async Mongo database handle.
        current_user: Decoded JWT claims (required).

    Returns:
        ``None`` — responds with HTTP 204 No Content on success.

    Raises:
        HTTPException: 401 if ``current`` does not verify, 400 if
            ``next`` is too short, 404 if the user record was deleted
            mid-session, 400 if ``next`` is identical to ``current``
            (we don't want a no-op rotation hiding broken UX).

    Example:
        >>> # POST /api/auth/me/password
        >>> # Authorization: Bearer <jwt>
        >>> # {"current": "old-pw", "next": "new-pw-1234"}
    """
    if len(body.next) < 6:
        raise HTTPException(
            status_code=400, detail="New password must be at least 6 characters"
        )
    if body.next == body.current:
        raise HTTPException(
            status_code=400, detail="New password must be different from current"
        )

    user_oid = ObjectId(current_user["id"])
    doc = await db.users.find_one({"_id": user_oid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current, doc["password_hash"]):
        # WHY: 401 (not 400) — the caller's claim about the current
        # password is auth-equivalent. Don't leak whether the user
        # exists in the message body either.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    await db.users.update_one(
        {"_id": user_oid},
        {
            "$set": {
                "password_hash": hash_password(body.next),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
