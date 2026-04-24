import { Injectable } from '@angular/core';

import type {
  FabricJson,
  FabricObjectJson,
  PaletteRole,
  PaletteSlot,
} from '../models/template.model';

/**
 * Ordered Brand-Kit slot roles.
 *
 * @remarks
 * The Brand-Kit color array is consumed positionally — index 0 → primary,
 * index 1 → secondary, etc. A palette slot whose `role` is not in this list
 * is treated as "no mapping" and the template's `default` is preserved.
 */
const ROLE_ORDER: readonly PaletteRole[] = [
  'primary',
  'secondary',
  'text',
  'accent',
  'background',
];

/** In-memory cache key → rendered data URL. */
type CacheKey = string;

/**
 * Pre-composes template thumbnails with the user's Brand Kit and caches the
 * rendered data URLs for the gallery.
 *
 * @remarks
 * Two responsibilities:
 *
 * 1. **Palette substitution** — {@link applyBrandKit} walks a fabric scene
 *    tree and swaps every `fill` / `stroke` that matches a palette-slot's
 *    `default` for the corresponding Brand-Kit color (by role order).
 * 2. **Rendering + caching** — {@link renderThumbnailDataUrl} pushes the
 *    modified scene through an offscreen fabric canvas and returns a PNG
 *    data URL bounded to 300×300. Results are memoized by
 *    `templateId + ':' + brandKitSignature`.
 *
 * The caller's fallback contract (PX-023 T-3) is: when Brand Kit is empty
 * **and** the template ships a non-empty `thumbnail_data_url`, skip this
 * service entirely and render the server-baked preview — the
 * {@link GalleryComponent} enforces that policy.
 *
 * @see Story PX-023
 */
@Injectable({ providedIn: 'root' })
export class TemplateThumbnailService {
  /** Memoization cache — `templateId:brandKitSignature` → PNG data URL. */
  private readonly cache = new Map<CacheKey, string>();

  /**
   * Produce a Brand-Kit-composed copy of a template's canvas JSON.
   *
   * @param canvasJson - The template's serialized fabric scene.
   * @param paletteSlots - Ordered palette slots declared by the template.
   * @param brandColors - The user's Brand-Kit colors in preferred order, or
   *   `null`/empty to request a no-op pass.
   * @returns A **new** {@link FabricJson} with every `fill`/`stroke` that
   *   matched a palette default rewritten to the corresponding Brand-Kit
   *   color. The input is never mutated. When `brandColors` is empty or
   *   `null`, the input is returned verbatim (same reference is acceptable —
   *   callers must not mutate the returned scene).
   *
   * @remarks
   * Match semantics: hex colors compare case-insensitively (`#FF0000` ==
   * `#ff0000`). Short (`#RGB`) and long (`#RRGGBB`) forms of the same color
   * are treated as equivalent by normalizing to `#RRGGBB` on both sides.
   *
   * Group support: fabric `group` objects carry a nested `objects` array —
   * we recurse into those so text inside a group is recolored too.
   *
   * @example
   * ```ts
   * const composed = svc.applyBrandKit(tmpl.canvas_json, tmpl.palette_slots, [
   *   '#123456', // primary
   *   '#FEDCBA', // secondary
   * ]);
   * ```
   *
   * @see Story PX-023 AC-3
   */
  applyBrandKit(
    canvasJson: FabricJson,
    paletteSlots: PaletteSlot[],
    brandColors: string[] | null,
  ): FabricJson {
    if (!brandColors || brandColors.length === 0) return canvasJson;

    // Build a default-hex → brand-color substitution table once per call.
    const substitutions = new Map<string, string>();
    for (const slot of paletteSlots ?? []) {
      const idx = ROLE_ORDER.indexOf(slot.role);
      if (idx < 0) continue;
      const replacement = brandColors[idx];
      if (!replacement) continue;
      substitutions.set(normalizeHex(slot.default), replacement);
    }

    if (substitutions.size === 0) return canvasJson;

    const mapped: FabricJson = {
      ...canvasJson,
      objects: (canvasJson.objects ?? []).map((obj) => remapObject(obj, substitutions)),
    };
    return mapped;
  }

  /**
   * Render a fabric scene to a PNG data URL, capped at 300×300.
   *
   * @param canvasJson - The scene to render (already Brand-Kit-composed).
   * @param width - Source canvas width in pixels.
   * @param height - Source canvas height in pixels.
   * @returns A promise that resolves to a `data:image/png;base64,…` URL.
   *
   * @remarks
   * Uses fabric's `StaticCanvas` — no event handlers, no selection — against
   * an offscreen `<canvas>` element. The multiplier is chosen so the longer
   * axis clamps to 300px (fabric's `toDataURL` takes `multiplier` relative
   * to the canvas's own pixel size).
   *
   * This path runs in the browser only. Unit tests mock fabric via
   * `vi.mock('fabric', …)` (see `canvas.service.spec.ts`) and never hit the
   * real renderer.
   *
   * @throws Error when fabric fails to hydrate the scene.
   */
  async renderThumbnailDataUrl(
    canvasJson: FabricJson,
    width: number,
    height: number,
  ): Promise<string> {
    // WHY: dynamic import keeps fabric out of the initial bundle for users
    // who never land on the gallery.
    const fabric = await import('fabric');
    const el = document.createElement('canvas');
    el.width = Math.max(1, width);
    el.height = Math.max(1, height);
    const staticCanvas = new fabric.StaticCanvas(el, {
      width: el.width,
      height: el.height,
      backgroundColor: (canvasJson.background as string) ?? '#ffffff',
    });
    try {
      await staticCanvas.loadFromJSON(canvasJson);
      staticCanvas.renderAll();
      const longest = Math.max(width, height);
      const multiplier = longest > 0 ? Math.min(1, 300 / longest) : 1;
      return staticCanvas.toDataURL({ format: 'png', multiplier });
    } finally {
      staticCanvas.dispose();
    }
  }

  /**
   * Get a cached thumbnail data URL, or render + memoize.
   *
   * @param templateId - The template's stable identifier — part of the cache key.
   * @param canvasJson - The scene to render if there's a cache miss.
   * @param width - Source canvas width.
   * @param height - Source canvas height.
   * @param brandKitSignature - A deterministic signature for the current
   *   Brand Kit (typically the Brand-Kit color list joined by `|`). Combined
   *   with `templateId` to form the cache key.
   * @returns The cached — or freshly rendered — PNG data URL.
   *
   * @example
   * ```ts
   * const sig = brandColors.join('|');
   * const url = await svc.getOrRenderThumbnail(t._id, t.canvas_json, w, h, sig);
   * ```
   */
  async getOrRenderThumbnail(
    templateId: string,
    canvasJson: FabricJson,
    width: number,
    height: number,
    brandKitSignature: string,
  ): Promise<string> {
    const key = `${templateId}:${brandKitSignature}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const rendered = await this.renderThumbnailDataUrl(canvasJson, width, height);
    this.cache.set(key, rendered);
    return rendered;
  }

  /**
   * Purge all cached thumbnails.
   *
   * @remarks
   * Intended for rare flows (logout, Brand-Kit wipe). The gallery itself
   * does not call this — its natural re-keying via `brandKitSignature`
   * already invalidates stale entries.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Normalize a hex color string to a lowercase `#rrggbb` form.
 *
 * @param hex - Any hex input (`#abc`, `#aabbcc`, `#AABBCC`).
 * @returns The normalized string, or the original input (lowercased) when
 *   the shape is not a recognized hex color.
 *
 * @remarks
 * Invalid inputs are returned untouched so the match map never grows an
 * entry that would collide with a future lookup — we silently accept
 * malformed template defaults rather than crash the gallery.
 */
function normalizeHex(hex: string): string {
  if (typeof hex !== 'string') return hex;
  const lower = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(lower)) {
    // Expand #rgb → #rrggbb.
    return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(lower)) return lower;
  return lower;
}

/**
 * Clone a fabric object, remapping its `fill`/`stroke` via the substitution
 * table and recursing into nested `objects` arrays.
 *
 * @param obj - The source fabric object JSON (never mutated).
 * @param subs - `normalizedHex → replacement` table built by
 *   {@link TemplateThumbnailService.applyBrandKit}.
 * @returns A shallow-cloned object with substituted colors.
 */
function remapObject(
  obj: FabricObjectJson,
  subs: Map<string, string>,
): FabricObjectJson {
  const next: FabricObjectJson = { ...obj };
  if (typeof next.fill === 'string') {
    const mapped = subs.get(normalizeHex(next.fill));
    if (mapped) next.fill = mapped;
  }
  if (typeof next.stroke === 'string') {
    const mapped = subs.get(normalizeHex(next.stroke));
    if (mapped) next.stroke = mapped;
  }
  if (Array.isArray(next.objects)) {
    next.objects = next.objects.map((child) => remapObject(child, subs));
  }
  return next;
}
