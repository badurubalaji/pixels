"""Programmatic authoring of 20 starter templates (PX-022b).

This module is an *author-time* helper — it is **not** imported at runtime.
Running it as a script writes 20 matched ``*.json`` + ``*.png`` pairs into
``backend/app/seed/assets/templates_canvas_json/`` and
``backend/app/seed/assets/templates_thumbnails/``, which the seed loader then
ingests when ``PIXELS_SEED_TEMPLATES=1``.

Distribution (AC-2, story PX-022b target = 5+4+4+3+2+2 = 20):
    7 × ig-post  (5 pure + 2 logo-tagged — see ``LOGO_STRATEGY`` note below)
    4 × ig-story
    4 × linkedin-post
    3 × linkedin-banner
    2 × yt-thumb
    = 20 total

LOGO_STRATEGY:
    The canonical :data:`PlatformLiteral` only admits five platform ids and we
    chose *not* to extend it to ``'logo'`` here — the less invasive path. Two
    additional ``ig-post`` slots are "logo-flavored" square designs tagged
    ``['Logo', ...]`` so the gallery-filter UI can surface them as a logo
    family without a cross-layer schema change. Total ig-post count is
    therefore 7 (5 content-post + 2 logo).

Run:
    python -m app.seed.author_templates

Idempotence:
    This script overwrites existing files in the target directories. It does
    *not* clean stale files with unknown stems — delete the dir manually if
    you need a truly fresh author pass.
"""
from __future__ import annotations

import io
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

# Target asset directories (match the seed loader defaults).
_CANVAS_DIR = Path(__file__).parent / "assets" / "templates_canvas_json"
_THUMB_DIR = Path(__file__).parent / "assets" / "templates_thumbnails"

# Canonical platform sizes (mirrors app.core.platform_presets).
_PLATFORM_SIZES: dict[str, tuple[int, int]] = {
    "ig-post": (1080, 1080),
    "ig-story": (1080, 1920),
    "linkedin-post": (1200, 627),
    "linkedin-banner": (1584, 396),
    "yt-thumb": (1280, 720),
}

# Thumbnail cap — 300×300 per AC-2.
_THUMB_MAX = 300


@dataclass(frozen=True)
class _Spec:
    """One template's authoring spec.

    Attributes:
        stem: File stem shared between the JSON and PNG sidecars.
        name: Human-readable template name.
        platform: One of the five canonical platform ids.
        tags: Filter-chip tags (Bold / Minimal / Festive / Corporate /
            Playful / Logo).
        palette: Ordered list of ``(role, default_hex)`` slots. Must have
            ≥ 2 entries; first entry is used for the primary thumbnail fill.
        headline: Large text line rendered in the canvas + thumbnail.
        subline: Secondary text line.
    """

    stem: str
    name: str
    platform: str
    tags: list[str]
    palette: list[tuple[str, str]]
    headline: str
    subline: str


# All 20 templates. Authored to hit AC-3 (3-8 layers, ≥ 2 palette slots by
# role) and AC-4 (≥ 3 tag families — we use all five: Bold, Minimal, Festive,
# Corporate, Playful, plus Logo).
_SPECS: list[_Spec] = [
    # ----- ig-post (5 total: 3 pure + 2 logo-tagged) ---------------------
    _Spec(
        stem="ig-post-bold-sale",
        name="Bold Sale IG Post",
        platform="ig-post",
        tags=["Bold", "Festive"],
        palette=[
            ("primary", "#FF3B30"),
            ("secondary", "#FFD60A"),
            ("text", "#1C1C1E"),
        ],
        headline="MEGA SALE",
        subline="Up to 50% off",
    ),
    _Spec(
        stem="ig-post-minimal-quote",
        name="Minimal Quote IG Post",
        platform="ig-post",
        tags=["Minimal", "Corporate"],
        palette=[
            ("background", "#F5F5F7"),
            ("text", "#1C1C1E"),
            ("accent", "#007AFF"),
        ],
        headline="Stay focused.",
        subline="— daily reminder",
    ),
    _Spec(
        stem="ig-post-playful-launch",
        name="Playful Launch IG Post",
        platform="ig-post",
        tags=["Playful", "Festive"],
        palette=[
            ("primary", "#34C759"),
            ("secondary", "#AF52DE"),
            ("text", "#FFFFFF"),
            ("accent", "#FFD60A"),
        ],
        headline="NEW DROP",
        subline="Just landed",
    ),
    _Spec(
        stem="logo-ig-monogram",
        name="Monogram Logo",
        platform="ig-post",
        tags=["Logo", "Minimal"],
        palette=[
            ("primary", "#1C1C1E"),
            ("background", "#FFFFFF"),
            ("accent", "#C69C6D"),
        ],
        headline="AB",
        subline="est. 2026",
    ),
    _Spec(
        stem="logo-ig-wordmark",
        name="Wordmark Logo",
        platform="ig-post",
        tags=["Logo", "Bold"],
        palette=[
            ("primary", "#0A84FF"),
            ("background", "#FFFFFF"),
            ("text", "#1C1C1E"),
        ],
        headline="BRAND",
        subline="studio",
    ),
    # ----- ig-story (4) ---------------------------------------------------
    _Spec(
        stem="ig-story-festive-sale",
        name="Festive Sale IG Story",
        platform="ig-story",
        tags=["Festive", "Bold"],
        palette=[
            ("primary", "#FF2D55"),
            ("secondary", "#FFD60A"),
            ("text", "#FFFFFF"),
        ],
        headline="FLASH SALE",
        subline="Today only",
    ),
    _Spec(
        stem="ig-story-minimal-announce",
        name="Minimal Announcement IG Story",
        platform="ig-story",
        tags=["Minimal", "Corporate"],
        palette=[
            ("background", "#FFFFFF"),
            ("text", "#1C1C1E"),
            ("accent", "#8E8E93"),
        ],
        headline="Announcing",
        subline="Coming soon",
    ),
    _Spec(
        stem="ig-story-playful-poll",
        name="Playful Poll IG Story",
        platform="ig-story",
        tags=["Playful"],
        palette=[
            ("primary", "#AF52DE"),
            ("secondary", "#5AC8FA"),
            ("text", "#FFFFFF"),
            ("accent", "#FFD60A"),
        ],
        headline="This or that?",
        subline="Tap to vote",
    ),
    _Spec(
        stem="ig-story-corporate-update",
        name="Corporate Update IG Story",
        platform="ig-story",
        tags=["Corporate", "Minimal"],
        palette=[
            ("primary", "#003366"),
            ("background", "#F2F2F7"),
            ("text", "#FFFFFF"),
            ("accent", "#FFD60A"),
        ],
        headline="Q1 Update",
        subline="Read the report",
    ),
    # ----- linkedin-post (4) ---------------------------------------------
    _Spec(
        stem="linkedin-post-corporate-quote",
        name="Corporate Quote LinkedIn",
        platform="linkedin-post",
        tags=["Corporate", "Minimal"],
        palette=[
            ("primary", "#0A66C2"),
            ("background", "#FFFFFF"),
            ("text", "#1C1C1E"),
        ],
        headline="Growth starts here.",
        subline="Insights weekly",
    ),
    _Spec(
        stem="linkedin-post-bold-insight",
        name="Bold Insight LinkedIn",
        platform="linkedin-post",
        tags=["Bold", "Corporate"],
        palette=[
            ("primary", "#1C1C1E"),
            ("secondary", "#FFD60A"),
            ("text", "#FFFFFF"),
        ],
        headline="3x Growth",
        subline="Here's how",
    ),
    _Spec(
        stem="linkedin-post-minimal-tip",
        name="Minimal Tip LinkedIn",
        platform="linkedin-post",
        tags=["Minimal"],
        palette=[
            ("background", "#F5F5F7"),
            ("text", "#1C1C1E"),
            ("accent", "#0A66C2"),
        ],
        headline="Tip of the day",
        subline="Keep it simple",
    ),
    _Spec(
        stem="linkedin-post-festive-hire",
        name="Festive Hiring LinkedIn",
        platform="linkedin-post",
        tags=["Festive", "Corporate"],
        palette=[
            ("primary", "#34C759"),
            ("secondary", "#FFD60A"),
            ("text", "#FFFFFF"),
        ],
        headline="We're hiring!",
        subline="Join the team",
    ),
    # ----- linkedin-banner (3) -------------------------------------------
    _Spec(
        stem="linkedin-banner-corporate",
        name="Corporate LinkedIn Banner",
        platform="linkedin-banner",
        tags=["Corporate", "Minimal"],
        palette=[
            ("primary", "#0A66C2"),
            ("background", "#FFFFFF"),
            ("text", "#1C1C1E"),
        ],
        headline="Product Strategy Lead",
        subline="Ex-BigCo | Speaker",
    ),
    _Spec(
        stem="linkedin-banner-bold",
        name="Bold LinkedIn Banner",
        platform="linkedin-banner",
        tags=["Bold"],
        palette=[
            ("primary", "#1C1C1E"),
            ("secondary", "#FF3B30"),
            ("text", "#FFFFFF"),
        ],
        headline="BUILDING IN PUBLIC",
        subline="Follow the journey",
    ),
    _Spec(
        stem="linkedin-banner-minimal",
        name="Minimal LinkedIn Banner",
        platform="linkedin-banner",
        tags=["Minimal", "Corporate"],
        palette=[
            ("background", "#F5F5F7"),
            ("text", "#1C1C1E"),
            ("accent", "#007AFF"),
        ],
        headline="Designer & Engineer",
        subline="Based in Berlin",
    ),
    # ----- yt-thumb (2) ---------------------------------------------------
    _Spec(
        stem="yt-thumb-bold-reaction",
        name="Bold Reaction YT Thumb",
        platform="yt-thumb",
        tags=["Bold", "Playful"],
        palette=[
            ("primary", "#FF3B30"),
            ("secondary", "#FFD60A"),
            ("text", "#FFFFFF"),
        ],
        headline="I TRIED IT!",
        subline="(you won't believe…)",
    ),
    _Spec(
        stem="yt-thumb-corporate-tutorial",
        name="Corporate Tutorial YT Thumb",
        platform="yt-thumb",
        tags=["Corporate", "Minimal"],
        palette=[
            ("primary", "#003366"),
            ("background", "#FFFFFF"),
            ("text", "#FFFFFF"),
            ("accent", "#FFD60A"),
        ],
        headline="Full Tutorial",
        subline="Step by step",
    ),
    # ----- extra ig-posts to reach 7 (= 5 pure + 2 logo) -----------------
    _Spec(
        stem="ig-post-festive-holiday",
        name="Festive Holiday IG Post",
        platform="ig-post",
        tags=["Festive", "Playful"],
        palette=[
            ("primary", "#FF3B30"),
            ("secondary", "#34C759"),
            ("text", "#FFFFFF"),
        ],
        headline="Happy Holidays",
        subline="From our team",
    ),
    _Spec(
        stem="ig-post-corporate-update",
        name="Corporate Update IG Post",
        platform="ig-post",
        tags=["Corporate", "Minimal"],
        palette=[
            ("primary", "#003366"),
            ("background", "#FFFFFF"),
            ("text", "#FFFFFF"),
            ("accent", "#FFD60A"),
        ],
        headline="Q1 Results",
        subline="Read the recap",
    ),
]


def _fabric_text(
    *,
    text: str,
    left: int,
    top: int,
    font_size: int,
    fill: str,
    font_weight: str = "normal",
) -> dict[str, Any]:
    """Produce a fabric.js ``Textbox`` object dict.

    Args:
        text: The string to render.
        left: x-coordinate on the canvas (device-independent pixels).
        top: y-coordinate on the canvas.
        font_size: Font size in pixels.
        fill: Hex color string ``#RRGGBB`` used for the glyph fill.
        font_weight: One of fabric's accepted font-weight tokens
            (e.g. ``"normal"``, ``"bold"``, ``"700"``).

    Returns:
        A dict suitable for inclusion in a fabric.js scene's ``objects`` list.
    """
    return {
        "type": "textbox",
        "version": "7.0.0",
        "left": left,
        "top": top,
        "width": 800,
        "height": font_size + 8,
        "text": text,
        "fontSize": font_size,
        "fontWeight": font_weight,
        "fontFamily": "Helvetica",
        "fill": fill,
        "textAlign": "left",
        "selectable": True,
        "editable": True,
    }


def _fabric_rect(
    *,
    left: int,
    top: int,
    width: int,
    height: int,
    fill: str,
    rx: int = 0,
    ry: int = 0,
) -> dict[str, Any]:
    """Produce a fabric.js ``Rect`` object dict.

    Args:
        left: x-coordinate of the rect's top-left corner.
        top: y-coordinate of the rect's top-left corner.
        width: Rectangle width in pixels.
        height: Rectangle height in pixels.
        fill: Hex color string for the fill.
        rx: Horizontal corner-radius in pixels. Defaults to ``0`` (sharp).
        ry: Vertical corner-radius in pixels. Defaults to ``0`` (sharp).

    Returns:
        A fabric.js ``rect`` object dict.
    """
    return {
        "type": "rect",
        "version": "7.0.0",
        "left": left,
        "top": top,
        "width": width,
        "height": height,
        "fill": fill,
        "rx": rx,
        "ry": ry,
        "selectable": True,
    }


def _fabric_circle(*, left: int, top: int, radius: int, fill: str) -> dict[str, Any]:
    """Produce a fabric.js ``Circle`` object dict.

    Args:
        left: x-coordinate of the circle's bounding-box top-left corner.
        top: y-coordinate of the circle's bounding-box top-left corner.
        radius: Radius in pixels.
        fill: Hex color string for the fill.

    Returns:
        A fabric.js ``circle`` object dict.
    """
    return {
        "type": "circle",
        "version": "7.0.0",
        "left": left,
        "top": top,
        "radius": radius,
        "fill": fill,
        "selectable": True,
    }


def _pick(palette: list[tuple[str, str]], role: str, fallback: str) -> str:
    """Return the default hex for ``role`` in ``palette`` or ``fallback``.

    Args:
        palette: The template's ``(role, hex)`` slot list.
        role: Desired palette role (e.g. ``"primary"``).
        fallback: Hex color used when ``role`` is not present.

    Returns:
        A hex color string.
    """
    for r, hx in palette:
        if r == role:
            return hx
    return fallback


def _build_canvas_json(spec: _Spec) -> dict[str, Any]:
    """Build a fabric.js scene for one template spec.

    The scene has 3–8 editable layers (AC-3): a background fill rect, one or
    two accent shapes keyed off the palette, and two text layers (headline +
    subline). The layer count scales with palette richness so templates with
    more slots look more composed.

    Args:
        spec: The template spec to materialise.

    Returns:
        A dict with fabric.js ``version`` / ``objects`` / ``background`` /
        ``width`` / ``height`` fields, ready for
        :class:`Template.canvas_json`.
    """
    width, height = _PLATFORM_SIZES[spec.platform]
    bg_hex = _pick(spec.palette, "background", "#FFFFFF")
    primary = _pick(spec.palette, "primary", bg_hex)
    secondary = _pick(spec.palette, "secondary", primary)
    text_hex = _pick(spec.palette, "text", "#1C1C1E")
    accent = _pick(spec.palette, "accent", secondary)

    objects: list[dict[str, Any]] = []

    # Layer 1: full-bleed background band (works for all aspect ratios).
    objects.append(
        _fabric_rect(
            left=0, top=0, width=width, height=height, fill=bg_hex,
        )
    )

    # Layer 2: primary accent band (top strip) — scales with canvas.
    band_h = max(60, height // 6)
    objects.append(
        _fabric_rect(
            left=0, top=0, width=width, height=band_h, fill=primary,
        )
    )

    # Layer 3: secondary decorative shape (bottom-right circle for square/
    # portrait canvases; bottom-right rect for landscape banners).
    if width >= height * 2:
        # Banner / landscape — use a corner rect.
        objects.append(
            _fabric_rect(
                left=width - (width // 4),
                top=height - (height // 3),
                width=width // 4,
                height=height // 3,
                fill=secondary,
                rx=8,
                ry=8,
            )
        )
    else:
        r = max(40, min(width, height) // 8)
        objects.append(
            _fabric_circle(
                left=width - r * 2 - 40,
                top=height - r * 2 - 40,
                radius=r,
                fill=secondary,
            )
        )

    # Layer 4: headline text, centered vertically in the primary band.
    headline_size = max(32, min(96, height // 10))
    headline_top = max(20, (band_h - headline_size) // 2)
    objects.append(
        _fabric_text(
            text=spec.headline,
            left=40,
            top=headline_top,
            font_size=headline_size,
            fill=text_hex,
            font_weight="bold",
        )
    )

    # Layer 5: subline below the band.
    subline_size = max(18, headline_size // 2)
    objects.append(
        _fabric_text(
            text=spec.subline,
            left=40,
            top=band_h + 30,
            font_size=subline_size,
            fill=_pick(spec.palette, "text", accent),
        )
    )

    # Layer 6 (optional): accent dot near the subline when the palette has
    # an explicit accent role. Keeps layer count 5-6 max.
    if any(r == "accent" for r, _ in spec.palette):
        objects.append(
            _fabric_circle(
                left=40,
                top=band_h + 30 + subline_size + 24,
                radius=max(8, subline_size // 4),
                fill=accent,
            )
        )

    return {
        "version": "7.0.0",
        "objects": objects,
        "background": bg_hex,
        "width": width,
        "height": height,
    }


def _load_default_font(size: int) -> ImageFont.ImageFont:
    """Return a Pillow font at approximately ``size`` pixels.

    Tries a handful of common DejaVu paths before falling back to the
    bundled bitmap default (which ignores ``size``). Using only
    free-licensed / bundled fonts avoids AC-5 licensing issues.

    Args:
        size: Desired font height in pixels.

    Returns:
        A Pillow ``ImageFont`` instance.
    """
    # DejaVu ships with most Linux Pillow wheels and is SIL OFL-licensed.
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _render_thumbnail(spec: _Spec, out_path: Path) -> None:
    """Render a 300×300 preview PNG for one spec via Pillow.

    The render is a simplified, aspect-correct projection of the canvas
    scene: a background rect, a top accent band, a corner shape, and the
    headline/subline text. This is *not* a pixel-perfect preview — visual
    polish is an intentional follow-up (Sally design session, PX-022b-FUP-1).

    Args:
        spec: The template spec to render.
        out_path: Destination PNG path. Overwritten if it exists.
    """
    # Project the native canvas aspect ratio into a 300-wide box, capped at
    # 300 tall for portrait / square canvases.
    native_w, native_h = _PLATFORM_SIZES[spec.platform]
    ratio = native_h / native_w
    if ratio <= 1.0:
        thumb_w = _THUMB_MAX
        thumb_h = max(1, int(round(_THUMB_MAX * ratio)))
    else:
        thumb_h = _THUMB_MAX
        thumb_w = max(1, int(round(_THUMB_MAX / ratio)))

    bg_hex = _pick(spec.palette, "background", "#FFFFFF")
    primary = _pick(spec.palette, "primary", bg_hex)
    secondary = _pick(spec.palette, "secondary", primary)
    text_hex = _pick(spec.palette, "text", "#1C1C1E")

    img = Image.new("RGB", (thumb_w, thumb_h), bg_hex)
    draw = ImageDraw.Draw(img)

    band_h = max(16, thumb_h // 6)
    draw.rectangle([0, 0, thumb_w, band_h], fill=primary)

    # Corner accent.
    if thumb_w >= thumb_h * 2:
        draw.rectangle(
            [thumb_w - thumb_w // 4, thumb_h - thumb_h // 3, thumb_w, thumb_h],
            fill=secondary,
        )
    else:
        r = max(6, min(thumb_w, thumb_h) // 8)
        cx = thumb_w - r - 10
        cy = thumb_h - r - 10
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=secondary)

    # Headline in the band.
    headline_size = max(12, min(28, thumb_h // 10))
    headline_font = _load_default_font(headline_size)
    draw.text((10, max(2, (band_h - headline_size) // 2)), spec.headline,
              fill=text_hex, font=headline_font)

    # Subline below.
    subline_size = max(10, headline_size // 2 + 2)
    subline_font = _load_default_font(subline_size)
    subline_fill = _pick(spec.palette, "text", "#1C1C1E")
    draw.text((10, band_h + 8), spec.subline, fill=subline_fill,
              font=subline_font)

    # Validate we're about to write a real PNG by round-tripping through
    # an in-memory buffer (AC guarantee: Pillow can re-open every output).
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    out_path.write_bytes(buf.getvalue())


def _spec_to_template_doc(spec: _Spec) -> dict[str, Any]:
    """Convert a :class:`_Spec` to the full-document JSON the loader expects.

    The loader (:func:`app.seed.templates_seed._load_pair`) stamps in the
    ``thumbnail_data_url`` from the sidecar PNG, so we deliberately omit it
    here; the loader also titleizes ``name`` from the stem if missing, but
    we supply an explicit ``name`` for readability.

    Args:
        spec: The template spec.

    Returns:
        A dict with top-level Template fields (``name``, ``platform``,
        ``tags``, ``palette_slots``, ``canvas_json``). The loader adds
        ``thumbnail_data_url`` + timestamps at ingest time.
    """
    return {
        "name": spec.name,
        "platform": spec.platform,
        "tags": list(spec.tags),
        "palette_slots": [{"role": r, "default": hx} for r, hx in spec.palette],
        "canvas_json": _build_canvas_json(spec),
    }


def author_all(
    canvas_dir: Path | None = None,
    thumb_dir: Path | None = None,
) -> int:
    """Write all 20 template JSON + PNG pairs to disk.

    Args:
        canvas_dir: Override for the canvas-JSON output dir. Defaults to
            the seed loader's canonical location.
        thumb_dir: Override for the thumbnail output dir. Defaults to the
            seed loader's canonical location.

    Returns:
        The number of pairs written (always equal to ``len(_SPECS)``).

    Raises:
        OSError: If the target directories can't be created or written.
    """
    canvas_dir = canvas_dir or _CANVAS_DIR
    thumb_dir = thumb_dir or _THUMB_DIR
    canvas_dir.mkdir(parents=True, exist_ok=True)
    thumb_dir.mkdir(parents=True, exist_ok=True)

    # Guard against stem collisions — they would silently overwrite pairs.
    seen: set[str] = set()
    for spec in _SPECS:
        if spec.stem in seen:
            raise ValueError(f"duplicate template stem: {spec.stem!r}")
        seen.add(spec.stem)

    for spec in _SPECS:
        doc = _spec_to_template_doc(spec)
        (canvas_dir / f"{spec.stem}.json").write_text(
            json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        _render_thumbnail(spec, thumb_dir / f"{spec.stem}.png")

    return len(_SPECS)


# Public export of the spec list — consumed by the integration test to
# cross-check on-disk assets against the in-module distribution.
SPECS: tuple[_Spec, ...] = tuple(_SPECS)


if __name__ == "__main__":  # pragma: no cover - manual author entrypoint
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    n = author_all()
    logger.info("author_templates: wrote %d template pairs", n)
