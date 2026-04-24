"""Core backend primitives (config, shared constants, security helpers).

Currently exposes:
    platform_presets: the canonical platform-size preset list mirrored by
        ``pixelforge/src/app/core/constants/platform-presets.ts`` and guarded
        against drift by ``backend/tests/test_platform_preset_parity.py``.
"""
from __future__ import annotations
