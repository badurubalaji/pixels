import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_HOURS = 24 * 7  # 7 days

# PX-074 — transactional email (Resend). Service was picked autonomously
# per the saved feedback rule on full Orion autonomy + the architect agent's
# trade-off matrix recommendation. Resend was the simplest API for our scale
# (single API key, REST endpoint, no webhook setup, generous free tier).
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM_ADDRESS = os.getenv("EMAIL_FROM_ADDRESS", "noreply@pixelforge.io")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:4201")
EMAIL_CHANGE_TOKEN_TTL_HOURS = int(os.getenv("EMAIL_CHANGE_TOKEN_TTL_HOURS", "1"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime


class UserUpdate(BaseModel):
    """Partial-update payload for the authenticated user's own profile.

    Fields default to ``None`` and are only applied when present in the
    request body — a ``null`` or empty string clears the field, a missing
    key leaves it unchanged. PX-071 only surfaces ``name`` because other
    fields need separate flows (email change = re-verification, password
    rotation = current-password check).
    """

    name: Optional[str] = None


class EmailChangeRequest(BaseModel):
    """Authenticated email-change request (PX-074).

    The user supplies a new email and their current password. We send a
    confirmation link to the NEW address; the change is committed only
    when that link is clicked. Old address gets a notification so an
    attacker who briefly held a valid JWT can't quietly redirect mail.
    """

    new_email: EmailStr
    password: str


class EmailChangeConfirm(BaseModel):
    """Token consumed by the confirmation link (PX-074)."""

    token: str


class PasswordChange(BaseModel):
    """Authenticated password-rotation payload (PX-075).

    Both fields are required. ``current`` is verified against the stored
    bcrypt hash before ``next`` is hashed-and-persisted, so a leaked JWT
    alone cannot rotate a password — the caller still needs to know the
    current password.
    """

    current: str
    next: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def create_email_change_token(user_id: str, new_email: str) -> str:
    """Build a short-lived JWT for the email-change confirmation link (PX-074).

    The token's payload distinguishes itself from auth tokens with a
    ``token_type`` field so the same JWT secret can sign both without
    risking that an email-change token gets accepted as a session token
    (or vice-versa). TTL defaults to 1 hour — long enough to survive a
    briefly delayed inbox, short enough that a leaked link rots quickly.
    """
    payload = {
        "sub": user_id,
        "new_email": new_email,
        "token_type": "email_change",
        "exp": datetime.now(timezone.utc) + timedelta(hours=EMAIL_CHANGE_TOKEN_TTL_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_email_change_token(token: str) -> dict:
    """Decode + validate an email-change token (PX-074).

    Returns the payload on success. Raises 400 if the token is wrong
    type, expired, or otherwise invalid.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Confirmation link has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid confirmation link")
    if payload.get("token_type") != "email_change":
        raise HTTPException(status_code=400, detail="Invalid confirmation link")
    return payload


async def get_current_user(request: Request) -> Optional[dict]:
    """Returns user dict if authenticated, None otherwise (optional auth)."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]
    try:
        payload = decode_token(token)
        return {"id": payload["sub"], "email": payload["email"]}
    except HTTPException:
        return None


async def require_user(request: Request) -> dict:
    """Requires authenticated user or raises 401."""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
