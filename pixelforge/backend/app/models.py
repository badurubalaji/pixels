from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = "Untitled"
    width: int = 1000
    height: int = 1000
    canvas_json: Optional[str] = None
    thumbnail: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    canvas_json: Optional[str] = None
    thumbnail: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    width: int
    height: int
    thumbnail: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProjectDetailResponse(ProjectResponse):
    canvas_json: Optional[str] = None


class AssetResponse(BaseModel):
    id: str
    filename: str
    content_type: str
    size: int
    project_id: Optional[str] = None
    created_at: datetime
    url: str
