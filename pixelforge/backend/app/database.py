import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pixelforge")
# Short timeout so a missing Mongo doesn't hang startup
MONGODB_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "2000"))

client: AsyncIOMotorClient = None
db = None
_connected: bool = False


async def connect_db():
    """Connect to MongoDB. Non-fatal if unavailable — endpoints that
    require the DB will return a clear error, but health-check and
    image-processing routes keep working."""
    global client, db, _connected

    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=MONGODB_TIMEOUT_MS)
        db = client[DB_NAME]

        # Verify the server is reachable
        await client.admin.command("ping")

        # Create indexes
        await db.projects.create_index("updated_at", expireAfterSeconds=None)
        await db.projects.create_index("created_at")
        await db.assets.create_index("project_id")

        _connected = True
        logger.info("MongoDB connected at %s", MONGODB_URL)
    except Exception as e:
        _connected = False
        logger.warning("MongoDB unavailable (%s) — running in stateless mode", e)


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    """Return the MongoDB database handle.

    Raises a clear error if the DB is not connected so callers fail fast.
    """
    if not _connected or db is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Start MongoDB or run docker-compose up.",
        )
    return db


def is_connected() -> bool:
    return _connected
