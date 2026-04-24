import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import image_router, health_router
from app.project_routes import project_router
from app.asset_routes import asset_router
from app.auth_routes import auth_router
from app.collab_routes import collab_router
from app.brand_routes import brand_router
from app.comments_routes import comments_router
from app.template_routes import template_router, seed_template_router
from app.database import connect_db, close_db, is_connected
from app.migrations import migrate_projects_platform_backfill
from app.seed import seed_templates

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan: open/close Mongo and optionally seed starter templates.

    Args:
        app: The FastAPI application instance (unused but required by spec).

    Yields:
        Control to the running server between startup and shutdown phases.

    The seed pass runs only when ``PIXELS_SEED_TEMPLATES=1`` in the env and the
    DB connected successfully. Seeder errors are logged but never abort
    startup — a missing seed should not take the API down.
    """
    await connect_db()
    # PX-060 T-0 — opt-in schema migration pass. Gated on the
    # ``PIXELS_RUN_MIGRATIONS`` env var so day-to-day restarts do not re-scan
    # the projects collection. Failures are logged and the server continues
    # booting — a bad migration must never take the API down.
    if os.getenv("PIXELS_RUN_MIGRATIONS") == "1":
        if is_connected():
            from app.database import db as live_db

            try:
                result = await migrate_projects_platform_backfill(live_db)
                logger.info(
                    "PIXELS_RUN_MIGRATIONS: projects.platform backfill — %s",
                    result,
                )
            except Exception as exc:  # noqa: BLE001 - log + continue is the contract
                logger.exception("PIXELS_RUN_MIGRATIONS: migration failed — %s", exc)
        else:
            logger.warning(
                "PIXELS_RUN_MIGRATIONS=1 but DB not connected — skipping migrations"
            )
    if os.getenv("PIXELS_SEED_TEMPLATES") == "1":
        if is_connected():
            # Re-import to pick up the module-level ``db`` that ``connect_db``
            # just populated. Avoids stale None from import-time binding.
            from app.database import db as live_db

            try:
                inserted = await seed_templates(live_db)
                logger.info("PIXELS_SEED_TEMPLATES: seeded %d templates", inserted)
            except Exception as exc:  # noqa: BLE001 - log + continue is the contract
                logger.exception("PIXELS_SEED_TEMPLATES: seeding failed — %s", exc)
        else:
            logger.warning(
                "PIXELS_SEED_TEMPLATES=1 but DB not connected — skipping seed"
            )
    yield
    await close_db()


app = FastAPI(
    title="PixelForge API",
    description="Canvas design tool API with MongoDB persistence",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:4400",
        "http://localhost:4000",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:4400",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(auth_router, prefix="/api", tags=["Auth"])
app.include_router(image_router, prefix="/api", tags=["Image Processing"])
app.include_router(project_router, prefix="/api", tags=["Projects"])
app.include_router(asset_router, prefix="/api", tags=["Assets"])
app.include_router(collab_router, prefix="/api")
app.include_router(brand_router, prefix="/api", tags=["Brand Kit"])
app.include_router(comments_router, prefix="/api", tags=["Comments"])
app.include_router(template_router, prefix="/api", tags=["Public Templates"])
app.include_router(seed_template_router, prefix="/api", tags=["Seed Templates"])
