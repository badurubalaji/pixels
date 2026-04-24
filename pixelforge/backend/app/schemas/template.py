"""Pydantic v2 schema for the ``templates`` collection (ARD §8.1).

These models describe *seed starter templates* — curated Canva-style starting
points keyed by platform and tags. They are distinct from the community-shared
``public_templates`` collection served by ``template_routes.py``. See
``_bmad-output/planning-artifacts/architecture/ard-mvp.md`` §8.1 for the
authoritative schema.

Example:
    >>> slot = PaletteSlot(role="primary", default="#FF5722")
    >>> tpl = Template(
    ...     name="Festive Sale IG Post",
    ...     platform="ig-post",
    ...     tags=["Festive", "Bold"],
    ...     canvas_json={"objects": []},
    ...     thumbnail_data_url="data:image/png;base64,AAA",
    ...     palette_slots=[slot],
    ... )
    >>> tpl.is_template
    True
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

PlatformLiteral = Literal[
    "ig-post",
    "ig-story",
    "linkedin-post",
    "linkedin-banner",
    "yt-thumb",
]
"""Allowed platform ids for a seed template.

Mirrors :data:`app.core.platform_presets.PlatformType` but intentionally omits
``custom`` — a starter template must target a concrete platform size.
"""

PaletteRoleLiteral = Literal["primary", "secondary", "text", "accent", "background"]
"""Allowed role names for a palette slot.

Seed templates expose a small, curated vocabulary of roles that the Brand-Kit
auto-apply pass (PX-060) maps to user-chosen colors at instantiation time.
"""


class PaletteSlot(BaseModel):
    """One palette slot declared by a seed template.

    A palette slot pairs a *role* (e.g. ``primary``) with a *default hex color*.
    When a user instantiates a template, the Brand-Kit auto-apply pass swaps
    the default color for the user's matching brand color — one color per role.

    Attributes:
        role: Logical name for the color's purpose inside the template.
        default: Fallback hex color string (``#RRGGBB`` or ``#RGB``) used when
            no Brand Kit color is available for ``role``.
    """

    model_config = ConfigDict(extra="forbid")

    role: PaletteRoleLiteral = Field(
        ...,
        description=(
            "Logical slot name. Brand-Kit auto-apply (PX-060) maps this role "
            "to a user color at instantiation time."
        ),
    )
    default: str = Field(
        ...,
        description="Default hex color (``#RRGGBB`` or ``#RGB``) for this slot.",
    )

    @field_validator("default")
    @classmethod
    def _validate_hex(cls, value: str) -> str:
        """Require a leading ``#`` followed by 3 or 6 hex digits.

        Args:
            value: The raw value supplied for ``default``.

        Returns:
            The same string, unchanged, when validation passes.

        Raises:
            ValueError: If ``value`` is not a valid ``#RGB`` or ``#RRGGBB``
                hex color string.
        """
        if not (
            isinstance(value, str)
            and value.startswith("#")
            and len(value) in (4, 7)
            and all(c in "0123456789abcdefABCDEF" for c in value[1:])
        ):
            raise ValueError(
                f"palette_slots.default must be a #RGB or #RRGGBB hex color, got {value!r}"
            )
        return value


def _utc_now() -> datetime:
    """Return the current UTC time as a timezone-aware :class:`datetime`.

    Returns:
        A timezone-aware ``datetime`` anchored to UTC. Factored out so tests
        can monkeypatch time without patching the stdlib.
    """
    return datetime.now(timezone.utc)


class Template(BaseModel):
    """A seed starter template document, per ARD §8.1.

    Validates every field the backend writes to the ``templates`` collection.
    The seeder (:mod:`app.seed.templates_seed`) constructs one ``Template``
    per asset pair, calls :meth:`model_dump` with ``mode="python"``, and
    inserts the resulting dict via Motor.

    Attributes:
        name: Human-readable template name (non-empty).
        platform: One of the five supported platform ids
            (see :data:`PlatformLiteral`). ``custom`` is rejected.
        tags: Free-form tag strings. Empty list means "untagged".
        canvas_json: Serialized fabric.js scene. Stored as a nested dict so
            Mongo can index / update sub-fields if ever needed.
        thumbnail_data_url: Preview image as a ``data:image/...`` URL. Must be
            bounded to 300×300 at author time (enforced in PX-022b tooling,
            not here, because we cannot introspect embedded PNG dimensions
            without pulling Pillow into the hot schema path).
        palette_slots: Ordered list of Brand-Kit mapping slots.
        is_template: Discriminator marking this document as a seed template.
            Always ``True`` for rows in this collection.
        created_at: Insertion timestamp (UTC, timezone-aware).
        updated_at: Last-mutation timestamp (UTC, timezone-aware).
    """

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, description="Template display name.")
    platform: PlatformLiteral = Field(
        ...,
        description=(
            "Target platform id. Must match one of the five concrete presets "
            "in ``app.core.platform_presets`` (``custom`` is not allowed)."
        ),
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Free-form tag strings used by the gallery filter UI.",
    )
    canvas_json: dict[str, Any] = Field(
        ...,
        description="Serialized fabric.js scene stored as a nested document.",
    )
    thumbnail_data_url: str = Field(
        ...,
        description=(
            "Preview thumbnail as a ``data:image/*;base64,...`` URL. "
            "Author tooling (PX-022b) enforces the 300×300 cap."
        ),
    )
    palette_slots: list[PaletteSlot] = Field(
        default_factory=list,
        description="Brand-Kit mapping slots — see :class:`PaletteSlot`.",
    )
    is_template: Literal[True] = Field(
        default=True,
        description="Always ``True`` — discriminator for the collection.",
    )
    created_at: datetime = Field(
        default_factory=_utc_now,
        description="Timezone-aware UTC insertion timestamp.",
    )
    updated_at: datetime = Field(
        default_factory=_utc_now,
        description="Timezone-aware UTC last-mutation timestamp.",
    )

    @field_validator("thumbnail_data_url")
    @classmethod
    def _validate_data_url(cls, value: str) -> str:
        """Require ``thumbnail_data_url`` to start with ``data:image/``.

        Args:
            value: Raw value supplied for ``thumbnail_data_url``.

        Returns:
            The same string when validation passes.

        Raises:
            ValueError: If ``value`` is not a ``data:image/...`` URL.
        """
        if not value.startswith("data:image/"):
            raise ValueError(
                "thumbnail_data_url must be a data:image/* URL "
                f"(got prefix {value[:32]!r})"
            )
        return value
