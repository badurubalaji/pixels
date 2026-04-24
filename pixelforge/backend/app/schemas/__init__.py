"""Pydantic v2 schemas for request/response DTOs and domain documents.

Sub-modules group schemas by domain (``template`` for seed starter templates,
``brand_kit`` for brand kits, etc.). Each module exports its own models; this
package file exists so ``app.schemas`` is importable and so downstream code can
discover schema modules via ``pkgutil`` if the need arises later.
"""
from __future__ import annotations
