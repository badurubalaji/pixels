"""Canonical platform-size presets (backend source of truth).

This module mirrors the frontend constants file at
``pixelforge/src/app/core/constants/platform-presets.ts``. ARD §7.1 mandates
a single source of truth for platform presets; any new preset **must be
added here first**, then replicated on the frontend.

A pytest parity guard (``backend/tests/test_platform_preset_parity.py``)
parses both files and fails CI if any ``(id, width, height, label, aspect)``
tuple drifts between them.

Example:
    >>> from app.core.platform_presets import PLATFORM_PRESETS, get_platform_preset
    >>> get_platform_preset("ig-post").width
    1080

See:
    _bmad-output/planning-artifacts/architecture/ard-mvp.md §7.1
    Story PX-020
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

PlatformType = Literal[
    "ig-post",
    "ig-story",
    "linkedin-post",
    "linkedin-banner",
    "yt-thumb",
    "custom",
]


@dataclass(frozen=True)
class PlatformPreset:
    """One platform-size preset record.

    Attributes:
        id: Stable identifier used in URLs, DB documents, and parity checks.
            Must be one of the values in :data:`PlatformType`.
        label: Human-readable label rendered in UI surfaces.
        width: Canvas width in device-independent pixels. ``0`` means
            "user-defined" (the ``custom`` sentinel).
        height: Canvas height in device-independent pixels. ``0`` means
            "user-defined" (the ``custom`` sentinel).
        aspect: Aspect ratio as a display string (e.g. ``"1:1"``, ``"16:9"``).
        icon: Optional Material icon ligature for UI affordances.
    """

    id: str
    label: str
    width: int
    height: int
    aspect: str
    icon: Optional[str] = None


PLATFORM_PRESETS: tuple[PlatformPreset, ...] = (
    PlatformPreset(
        id="ig-post",
        label="Instagram Post",
        width=1080,
        height=1080,
        aspect="1:1",
        icon="camera_alt",
    ),
    PlatformPreset(
        id="ig-story",
        label="Instagram Story",
        width=1080,
        height=1920,
        aspect="9:16",
        icon="photo_camera",
    ),
    PlatformPreset(
        id="linkedin-post",
        label="LinkedIn Post",
        width=1200,
        height=627,
        aspect="1.91:1",
        icon="work",
    ),
    PlatformPreset(
        id="linkedin-banner",
        label="LinkedIn Banner",
        width=1584,
        height=396,
        aspect="4:1",
        icon="view_carousel",
    ),
    PlatformPreset(
        id="yt-thumb",
        label="YouTube Thumbnail",
        width=1280,
        height=720,
        aspect="16:9",
        icon="smart_display",
    ),
    PlatformPreset(
        id="custom",
        label="Custom",
        width=0,
        height=0,
        aspect="custom",
        icon="tune",
    ),
)
"""Ordered list of all supported platform presets for MVP.

Order is load-bearing for UI rendering. The ``custom`` entry at the tail is a
sentinel for user-defined canvases (0×0) — consumers must branch on it and
skip auto-resize.
"""


PLATFORM_IDS: frozenset[str] = frozenset(p.id for p in PLATFORM_PRESETS)
"""Set of every valid preset id, handy for ``Literal``/validator checks."""


def get_platform_preset(preset_id: str | None) -> Optional[PlatformPreset]:
    """Look up a platform preset by id.

    Args:
        preset_id: The preset id to find. May be ``None`` for convenience
            at call sites that pass through optional query params.

    Returns:
        The matching :class:`PlatformPreset`, or ``None`` if ``preset_id``
        is falsy or does not match any known preset.

    Example:
        >>> get_platform_preset("yt-thumb").height
        720
        >>> get_platform_preset("nope") is None
        True
    """
    if not preset_id:
        return None
    for preset in PLATFORM_PRESETS:
        if preset.id == preset_id:
            return preset
    return None
