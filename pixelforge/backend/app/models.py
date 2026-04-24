"""Request / response Pydantic v2 models for the core project + asset APIs.

PX-060 (T-0) extends ``ProjectCreate``/``ProjectUpdate``/``ProjectDetailResponse``
with three optional fields that trace a project back to a starter template and
drive the editor's Brand-Kit auto-apply toast:

    * ``source_template_id`` — originating seed template ``_id`` (or ``None``).
    * ``brand_kit_applied_at`` — ISO 8601 UTC timestamp of the last Brand-Kit
      auto-apply pass; cleared by the editor Undo action.
    * ``platform`` — canonical platform preset id (e.g. ``ig-post``) used by
      dashboards and the auto-apply heuristic.

All three fields are optional and default to ``None`` so the wire stays
backward-compatible with pre-PX-060 clients and legacy Mongo rows.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """Incoming payload for ``POST /api/projects``.

    Attributes:
        name: Display name; defaults to ``"Untitled"``.
        width: Canvas width in pixels; defaults to 1000.
        height: Canvas height in pixels; defaults to 1000.
        canvas_json: Optional serialized fabric.js scene.
        thumbnail: Optional thumbnail data URL.
        source_template_id: Optional originating template ``_id`` (PX-060 T-0).
        brand_kit_applied_at: Optional ISO 8601 timestamp marking the moment
            the Brand-Kit auto-apply pass ran (PX-060 T-0).
        platform: Optional platform preset id — one of the ``PlatformType``
            literals or ``None`` for legacy / custom canvases (PX-060 T-0).
    """

    name: str = "Untitled"
    width: int = 1000
    height: int = 1000
    canvas_json: Optional[str] = None
    thumbnail: Optional[str] = None
    source_template_id: Optional[str] = Field(
        default=None,
        description="Originating seed-template _id, if created from a template.",
    )
    brand_kit_applied_at: Optional[datetime] = Field(
        default=None,
        description="UTC timestamp of the last Brand-Kit auto-apply pass.",
    )
    platform: Optional[str] = Field(
        default=None,
        description="Platform preset id (ig-post, yt-thumb, …) or None for custom.",
    )


class ProjectUpdate(BaseModel):
    """Partial update payload for ``PUT /api/projects/{id}``.

    All fields are optional; unset fields are preserved on the Mongo document.
    The PX-060 fields follow the same opt-in semantics — pass
    ``brand_kit_applied_at=None`` explicitly on the wire to leave it unchanged;
    the editor Undo path uses ``$set: {brand_kit_applied_at: null}`` directly
    via the repository to clear the marker.
    """

    name: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    canvas_json: Optional[str] = None
    thumbnail: Optional[str] = None
    source_template_id: Optional[str] = None
    brand_kit_applied_at: Optional[datetime] = None
    platform: Optional[str] = None


class ProjectResponse(BaseModel):
    """List-view projection of a project document.

    Excludes the heavyweight ``canvas_json`` payload — consumers who need the
    full scene must use ``GET /api/projects/{id}``.
    """

    id: str
    name: str
    width: int
    height: int
    thumbnail: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    source_template_id: Optional[str] = None
    brand_kit_applied_at: Optional[datetime] = None
    platform: Optional[str] = None


class ProjectDetailResponse(ProjectResponse):
    """Detail-view response — includes the full ``canvas_json`` string."""

    canvas_json: Optional[str] = None


class AssetResponse(BaseModel):
    """Asset metadata row returned from the assets router."""

    id: str
    filename: str
    content_type: str
    size: int
    project_id: Optional[str] = None
    created_at: datetime
    url: str
