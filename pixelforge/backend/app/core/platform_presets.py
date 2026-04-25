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
    "ig-reel",
    "fb-post",
    "fb-cover",
    "tw-post",
    "tw-header",
    "linkedin-post",
    "linkedin-banner",
    "yt-thumb",
    "yt-channel-art",
    "tiktok-video",
    "pinterest-pin",
    "presentation-16-9",
    "doc-a4",
    "doc-letter",
    "business-card",
    "logo",
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
    # --- Social: Instagram ---
    PlatformPreset(id="ig-post", label="Instagram Post", width=1080, height=1080, aspect="1:1", icon="camera_alt"),
    PlatformPreset(id="ig-story", label="Instagram Story", width=1080, height=1920, aspect="9:16", icon="photo_camera"),
    PlatformPreset(id="ig-reel", label="Instagram Reel", width=1080, height=1920, aspect="9:16", icon="movie"),
    # --- Social: Facebook ---
    PlatformPreset(id="fb-post", label="Facebook Post", width=1200, height=630, aspect="1.91:1", icon="thumb_up"),
    PlatformPreset(id="fb-cover", label="Facebook Cover", width=820, height=312, aspect="2.63:1", icon="panorama"),
    # --- Social: Twitter / X ---
    PlatformPreset(id="tw-post", label="Twitter Post", width=1200, height=675, aspect="16:9", icon="chat"),
    PlatformPreset(id="tw-header", label="Twitter Header", width=1500, height=500, aspect="3:1", icon="view_carousel"),
    # --- Social: LinkedIn ---
    PlatformPreset(id="linkedin-post", label="LinkedIn Post", width=1200, height=627, aspect="1.91:1", icon="work"),
    PlatformPreset(id="linkedin-banner", label="LinkedIn Banner", width=1584, height=396, aspect="4:1", icon="view_carousel"),
    # --- Video ---
    PlatformPreset(id="yt-thumb", label="YouTube Thumbnail", width=1280, height=720, aspect="16:9", icon="smart_display"),
    PlatformPreset(id="yt-channel-art", label="YouTube Channel Art", width=2560, height=1440, aspect="16:9", icon="theaters"),
    PlatformPreset(id="tiktok-video", label="TikTok Video", width=1080, height=1920, aspect="9:16", icon="music_video"),
    # --- Pinterest ---
    PlatformPreset(id="pinterest-pin", label="Pinterest Pin", width=1000, height=1500, aspect="2:3", icon="push_pin"),
    # --- Presentations / Docs ---
    PlatformPreset(id="presentation-16-9", label="Presentation (16:9)", width=1920, height=1080, aspect="16:9", icon="slideshow"),
    PlatformPreset(id="doc-a4", label="A4 Document", width=2480, height=3508, aspect="1:1.41", icon="description"),
    PlatformPreset(id="doc-letter", label="US Letter", width=2550, height=3300, aspect="1:1.29", icon="article"),
    # --- Print ---
    PlatformPreset(id="business-card", label="Business Card", width=1050, height=600, aspect="1.75:1", icon="badge"),
    PlatformPreset(id="logo", label="Logo", width=500, height=500, aspect="1:1", icon="auto_awesome"),
    # --- Sentinel ---
    PlatformPreset(id="custom", label="Custom", width=0, height=0, aspect="custom", icon="tune"),
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
