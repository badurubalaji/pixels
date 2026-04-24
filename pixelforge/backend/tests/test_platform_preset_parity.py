"""Parity guard: the FE and BE platform-preset lists must stay in sync.

ARD §7.1 mandates a single source of truth for platform presets. The backend
Python module at ``app/core/platform_presets.py`` and the frontend TypeScript
module at ``src/app/core/constants/platform-presets.ts`` are maintained as
mirrors, and this test fails CI if they drift.

The test re-implements a tiny regex parser against the TypeScript file — no
new runtime dependency (no TS parser library, per PX-020 constraints) — and
asserts every ``(id, label, width, height, aspect)`` tuple matches the
backend source of truth exactly and in the same order.
"""
from __future__ import annotations

import re
from pathlib import Path

from app.core.platform_presets import PLATFORM_PRESETS


# The frontend constants file sits two levels above `backend/` at:
#   pixelforge/src/app/core/constants/platform-presets.ts
#
# This test file lives at:
#   pixelforge/backend/tests/test_platform_preset_parity.py
#
# So the relative path from this file up to the TS file is "../../src/...".
FE_PRESETS_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "src"
    / "app"
    / "core"
    / "constants"
    / "platform-presets.ts"
)


# Each preset in the TS file is a single line inside the PLATFORM_PRESETS
# array literal, shaped like:
#
#   { id: 'ig-post', label: 'Instagram Post', width: 1080, height: 1080, aspect: '1:1', icon: 'camera_alt' },
#
# We parse only the fields that participate in parity (id, label, width,
# height, aspect). `icon` is intentionally ignored — it is pure presentation.
_PRESET_LINE_RE = re.compile(
    r"\{\s*"
    r"id:\s*'(?P<id>[a-z0-9\-]+)'\s*,\s*"
    r"label:\s*'(?P<label>[^']+)'\s*,\s*"
    r"width:\s*(?P<width>\d+)\s*,\s*"
    r"height:\s*(?P<height>\d+)\s*,\s*"
    r"aspect:\s*'(?P<aspect>[^']+)'"
)


def _parse_frontend_presets() -> list[tuple[str, str, int, int, str]]:
    """Parse the FE TS constants file into a list of tuples.

    Returns:
        One ``(id, label, width, height, aspect)`` tuple per preset, in the
        order they appear in the TS array literal.

    Raises:
        FileNotFoundError: If the TS file is missing — almost certainly a
            sign someone moved/renamed it without updating this guard.
        AssertionError: If no presets parse out; the regex failed to match
            anything, which is a real drift condition we must surface loudly.
    """
    text = FE_PRESETS_PATH.read_text(encoding="utf-8")
    # Narrow to the PLATFORM_PRESETS array body to avoid accidentally picking
    # up other object literals elsewhere in the file.
    array_match = re.search(
        r"PLATFORM_PRESETS\s*:\s*readonly\s+PlatformPreset\[\]\s*=\s*\[(?P<body>.*?)\]\s*as\s+const",
        text,
        re.DOTALL,
    )
    assert array_match, (
        "Could not find `PLATFORM_PRESETS: readonly PlatformPreset[] = [...] as const` "
        f"in {FE_PRESETS_PATH}. Has the file been restructured?"
    )
    body = array_match.group("body")

    results: list[tuple[str, str, int, int, str]] = []
    for match in _PRESET_LINE_RE.finditer(body):
        results.append(
            (
                match.group("id"),
                match.group("label"),
                int(match.group("width")),
                int(match.group("height")),
                match.group("aspect"),
            )
        )
    assert results, (
        "No presets parsed from the FE constants file — the regex in "
        "test_platform_preset_parity.py is probably out of date relative to "
        "the TS formatting. Update the regex or the TS file's shape."
    )
    return results


def test_frontend_file_exists() -> None:
    """The FE constants file must exist at the canonical path."""
    assert FE_PRESETS_PATH.is_file(), (
        f"Frontend platform-preset constants file missing at {FE_PRESETS_PATH}"
    )


def test_same_number_of_presets() -> None:
    """FE and BE must declare the same number of presets."""
    fe = _parse_frontend_presets()
    assert len(fe) == len(PLATFORM_PRESETS), (
        f"Preset count drift: FE has {len(fe)}, BE has {len(PLATFORM_PRESETS)}"
    )


def test_preset_tuples_match_in_order() -> None:
    """Every (id, label, width, height, aspect) tuple must match position-for-position."""
    fe = _parse_frontend_presets()
    be = [
        (p.id, p.label, p.width, p.height, p.aspect)
        for p in PLATFORM_PRESETS
    ]
    assert fe == be, (
        "Platform-preset drift detected between FE and BE.\n"
        f"  Frontend ({FE_PRESETS_PATH.name}):\n    "
        + "\n    ".join(repr(t) for t in fe)
        + f"\n  Backend (app/core/platform_presets.py):\n    "
        + "\n    ".join(repr(t) for t in be)
    )


def test_custom_sentinel_dimensions() -> None:
    """The ``custom`` preset is the user-defined sentinel at 0x0."""
    custom = next((p for p in PLATFORM_PRESETS if p.id == "custom"), None)
    assert custom is not None, "`custom` preset must exist on the backend"
    assert custom.width == 0 and custom.height == 0, (
        "`custom` preset must use the 0x0 sentinel so consumers can detect it"
    )
