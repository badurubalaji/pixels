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
from app.template_routes import template_router
from app.database import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
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
