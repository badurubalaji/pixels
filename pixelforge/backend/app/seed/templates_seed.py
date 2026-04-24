"""Seed the ``templates`` collection from on-disk asset pairs.

Canvas JSON designs live under ``backend/app/seed/assets/templates_canvas_json/``
as ``*.json`` files. Their preview thumbnails live under
``backend/app/seed/assets/templates_thumbnails/`` as ``*.png`` files with the
same stem (``foo.json`` pairs with ``foo.png``). Each paired asset becomes one
document matching :class:`app.schemas.template.Template` (ARD §8.1).

The seeder is idempotent: by default it skips if ``templates`` is non-empty.
Pass ``force=True`` to wipe and re-seed. Missing pair halves are logged and
skipped, never raised — content authoring (PX-022b) is responsible for pairing
files correctly.

Example:
    >>> # from app.seed.templates_seed import seed_templates
    >>> # inserted = await seed_templates(db)
    >>> # logger.info("seeded %d templates", inserted)
"""
from __future__ import annotations

import base64
import json
import logging
from pathlib import Path
from typing import Any, Protocol

from pydantic import ValidationError

from app.schemas.template import Template

logger = logging.getLogger(__name__)


# Default on-disk locations. Tests override via function parameters.
_DEFAULT_CANVAS_DIR = Path(__file__).parent / "assets" / "templates_canvas_json"
_DEFAULT_THUMB_DIR = Path(__file__).parent / "assets" / "templates_thumbnails"


class _TemplatesCollectionProto(Protocol):
    """Minimal Motor collection interface used by :func:`seed_templates`.

    Declared as a Protocol so tests can pass either a real
    ``motor.motor_asyncio.AsyncIOMotorCollection`` or a mongomock stand-in
    without widening the strict-mypy contract.
    """

    async def count_documents(self, filter: dict[str, Any]) -> int:
        """Return the number of documents matching ``filter``."""
        ...  # pragma: no cover - protocol stub

    async def delete_many(self, filter: dict[str, Any]) -> Any:
        """Delete every document matching ``filter``. Return is Motor-specific."""
        ...  # pragma: no cover - protocol stub

    async def insert_many(self, documents: list[dict[str, Any]]) -> Any:
        """Insert ``documents`` in bulk. Return is Motor-specific."""
        ...  # pragma: no cover - protocol stub


class _DatabaseProto(Protocol):
    """Protocol for the Motor-like DB handle passed to :func:`seed_templates`.

    Exposes only ``templates`` attribute access so the seeder can reach the
    collection without importing motor types directly (keeps the mypy-strict
    contract tight and keeps mongomock test doubles happy).
    """

    @property
    def templates(self) -> _TemplatesCollectionProto:
        """Return the ``templates`` collection handle."""
        ...  # pragma: no cover - protocol stub


def _load_pair(canvas_path: Path, thumb_path: Path) -> dict[str, Any] | None:
    """Load one ``(canvas.json, thumbnail.png)`` pair into a raw template dict.

    Reads the JSON file, base64-encodes the PNG as a ``data:image/png`` URL,
    and derives a default ``name`` from the file stem (titleized, hyphens
    turned to spaces). The JSON may embed any of the ``Template`` fields to
    override these defaults (e.g. supply its own ``name``, ``tags``,
    ``platform``, ``palette_slots``, ``canvas_json``).

    Args:
        canvas_path: Path to the ``*.json`` canvas design file.
        thumb_path: Path to the matching ``*.png`` thumbnail file.

    Returns:
        A dict ready to pass to :class:`Template` model validation. Returns
        ``None`` (and logs a warning) when either file is unreadable or the
        JSON is malformed.
    """
    try:
        raw = json.loads(canvas_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning(
            "seed_templates: skipping %s — failed to read/parse JSON (%s)",
            canvas_path.name,
            exc,
        )
        return None

    try:
        png_bytes = thumb_path.read_bytes()
    except OSError as exc:
        logger.warning(
            "seed_templates: skipping %s — failed to read thumbnail %s (%s)",
            canvas_path.name,
            thumb_path.name,
            exc,
        )
        return None

    data_url = "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")

    # The JSON file may be either:
    #  (a) a bare fabric.js scene (``{"objects": [...]}``) — we wrap it, OR
    #  (b) a full template doc with top-level fields overriding defaults.
    # We detect (b) by presence of any Template-level field.
    template_fields = {"name", "platform", "tags", "palette_slots", "canvas_json"}
    if isinstance(raw, dict) and any(k in raw for k in template_fields):
        doc: dict[str, Any] = dict(raw)
        doc.setdefault("name", _default_name_from_stem(canvas_path.stem))
        doc.setdefault("canvas_json", {})
        doc["thumbnail_data_url"] = data_url
        return doc

    # Bare scene form: caller must supply platform/tags via co-located sidecar
    # in PX-022b; for now we cannot synthesize those, so we log + skip.
    logger.warning(
        "seed_templates: %s is a bare fabric scene — expected top-level "
        "template fields (name/platform/tags/palette_slots). Skipping.",
        canvas_path.name,
    )
    return None


def _default_name_from_stem(stem: str) -> str:
    """Titleize a file stem for use as the default template name.

    Args:
        stem: File stem (no extension, no directory).

    Returns:
        A human-readable string, e.g. ``"festive-sale"`` → ``"Festive Sale"``.
    """
    return stem.replace("_", " ").replace("-", " ").strip().title() or stem


async def seed_templates(
    db: _DatabaseProto,
    force: bool = False,
    canvas_dir: Path | None = None,
    thumb_dir: Path | None = None,
) -> int:
    """Seed the ``templates`` collection from on-disk asset pairs.

    Args:
        db: Motor-compatible database handle. Must expose a ``templates``
            collection attribute.
        force: When ``False`` (default), skip seeding if the collection is
            already non-empty. When ``True``, wipe ``templates`` first and
            re-seed every pair.
        canvas_dir: Override for the canvas-JSON directory. Defaults to
            ``backend/app/seed/assets/templates_canvas_json/``.
        thumb_dir: Override for the thumbnail directory. Defaults to
            ``backend/app/seed/assets/templates_thumbnails/``.

    Returns:
        Count of documents actually inserted (``0`` when the collection was
        already populated and ``force=False``, or when no valid pairs were
        found on disk).

    Raises:
        No exceptions are raised for per-pair failures — malformed or
        incomplete pairs are logged as warnings and skipped. Only catastrophic
        DB errors (raised by the underlying Motor call) propagate.
    """
    canvas_dir = canvas_dir or _DEFAULT_CANVAS_DIR
    thumb_dir = thumb_dir or _DEFAULT_THUMB_DIR

    existing = await db.templates.count_documents({})
    if existing > 0 and not force:
        logger.info(
            "seed_templates: collection already has %d docs and force=False — skipping",
            existing,
        )
        return 0

    if force and existing > 0:
        logger.info("seed_templates: force=True — wiping %d existing docs", existing)
        await db.templates.delete_many({})

    if not canvas_dir.is_dir():
        logger.warning(
            "seed_templates: canvas dir %s does not exist — inserting 0", canvas_dir
        )
        return 0

    documents: list[dict[str, Any]] = []
    for canvas_path in sorted(canvas_dir.glob("*.json")):
        thumb_path = thumb_dir / f"{canvas_path.stem}.png"
        if not thumb_path.is_file():
            logger.warning(
                "seed_templates: no thumbnail for %s (expected %s) — skipping",
                canvas_path.name,
                thumb_path,
            )
            continue

        raw = _load_pair(canvas_path, thumb_path)
        if raw is None:
            continue

        try:
            template = Template.model_validate(raw)
        except ValidationError as exc:
            logger.warning(
                "seed_templates: %s failed schema validation — skipping (%s)",
                canvas_path.name,
                exc,
            )
            continue

        documents.append(template.model_dump(mode="python"))

    if not documents:
        logger.info("seed_templates: no valid pairs found — inserted 0")
        return 0

    await db.templates.insert_many(documents)
    logger.info("seed_templates: inserted %d templates", len(documents))
    return len(documents)
