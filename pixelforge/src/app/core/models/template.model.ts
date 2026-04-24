/**
 * TypeScript mirror of the backend seed-template schema (ARD §8.1).
 *
 * @remarks
 * The authoritative schema lives in
 * `pixelforge/backend/app/schemas/template.py` (Pydantic v2). This module is
 * the *frontend* shape consumed by the gallery (PX-023) and any future
 * consumer of `/api/v1/templates`. Keep in lock-step with the Python model —
 * PX-022a's parity guard only covers `platform_presets`, so field-level drift
 * here has to be policed by PR review.
 *
 * @see Story PX-023
 * @see _bmad-output/planning-artifacts/architecture/ard-mvp.md §8.1
 */

import type { PlatformType } from '../constants/platform-presets';

/**
 * Logical role names a template palette slot can take.
 *
 * @remarks
 * The Brand-Kit auto-apply pass (PX-060) maps these roles to user colors in
 * this order: `primary → brandColors[0]`, `secondary → brandColors[1]`,
 * `text → brandColors[2]`, `accent → brandColors[3]`,
 * `background → brandColors[4]`. Missing Brand-Kit entries fall through to
 * the template's `default` value.
 */
export type PaletteRole =
  | 'primary'
  | 'secondary'
  | 'text'
  | 'accent'
  | 'background';

/**
 * One palette slot declared by a seed template.
 *
 * @remarks
 * Mirrors the Pydantic `PaletteSlot` model on the backend. `default` is
 * always a `#RGB` or `#RRGGBB` hex string — Brand-Kit substitution matches
 * fabric object `fill`/`stroke` against this value (case-insensitive).
 */
export interface PaletteSlot {
  /** Logical slot name. */
  role: PaletteRole;
  /** Fallback hex color (`#RRGGBB` or `#RGB`). */
  default: string;
}

/**
 * A fabric.js scene JSON, stored as a nested object (not a string) on the
 * seed-templates collection.
 *
 * @remarks
 * We intentionally keep this loose — fabric's `loadFromJSON` accepts anything
 * shaped like `{ objects: [...], background?, ... }`. Forcing a stricter
 * shape would duplicate fabric's runtime contract without protecting anyone.
 */
export interface FabricJson {
  version?: string;
  objects?: FabricObjectJson[];
  background?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

/**
 * Shape of one fabric object inside a {@link FabricJson} scene.
 *
 * @remarks
 * Only the fields the Brand-Kit applier and the thumbnail renderer touch
 * are modeled. `unknown` elsewhere — we never introspect deeper than
 * `fill` / `stroke` during the pre-composition pass.
 */
export interface FabricObjectJson {
  type?: string;
  fill?: string;
  stroke?: string;
  objects?: FabricObjectJson[];
  [key: string]: unknown;
}

/**
 * A seed starter template as returned by `GET /api/v1/templates`.
 *
 * @remarks
 * The backend stringifies `_id` but leaves `canvas_json` as a nested dict.
 * Field names are snake_case on the wire — we keep them snake_case here
 * to avoid a mapping layer that would only add drift risk.
 *
 * @see Story PX-022a — the endpoint shape.
 */
export interface Template {
  /** MongoDB ObjectId (stringified). */
  _id: string;
  /** Human-readable display name. */
  name: string;
  /** Target platform (one of the five concrete presets). */
  platform: Exclude<PlatformType, 'custom'>;
  /** Free-form tag strings used by the gallery filter UI. */
  tags: string[];
  /** Serialized fabric.js scene. */
  canvas_json: FabricJson;
  /** Preview image as a `data:image/*;base64,…` URL (≤ 300×300). */
  thumbnail_data_url: string;
  /** Brand-Kit mapping slots. */
  palette_slots: PaletteSlot[];
  /** Discriminator — always `true` for rows in this collection. */
  is_template: true;
  /** ISO 8601 UTC timestamp string. */
  created_at: string;
  /** ISO 8601 UTC timestamp string. */
  updated_at: string;
}
