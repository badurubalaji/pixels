from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import (
    UserSignup,
    UserLogin,
    UserPublic,
    AuthResponse,
    hash_password,
    verify_password,
    create_token,
    require_user,
)
from app.database import get_db

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_to_public(doc: dict) -> UserPublic:
    return UserPublic(
        id=str(doc["_id"]),
        email=doc["email"],
        name=doc.get("name"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
    )


@auth_router.post("/signup", response_model=AuthResponse)
async def signup(body: UserSignup):
    db = get_db()

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
async def login(body: UserLogin):
    db = get_db()

    doc = await db.users.find_one({"email": body.email.lower()})
    if not doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(body.password, doc["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = _user_to_public(doc)
    token = create_token(user.id, user.email)

    return AuthResponse(token=token, user=user)


@auth_router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(require_user)):
    db = get_db()
    doc = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_public(doc)
