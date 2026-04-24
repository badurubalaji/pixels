/**
 * Canonical platform-size presets for the pixels editor.
 *
 * @remarks
 * This module is the **single source of truth** on the frontend for the
 * platform sizes exposed in the Hub, template gallery, `ExportDialog`, and the
 * `?platform=` query-parameter plumbing in the `Editor`.
 *
 * A mirrored Python module lives at `backend/app/core/platform_presets.py`
 * (see ARD §7.1). A pytest parity guard
 * (`backend/tests/test_platform_preset_parity.py`) fails CI if any
 * `(id, width, height, label, aspect)` tuple drifts between the two files.
 *
 * **Add new presets in the Python file first**, then replicate here. The
 * `custom` entry is a sentinel (0×0) — consumers must interpret it as
 * "user-defined" and skip any auto-resize.
 *
 * @see _bmad-output/planning-artifacts/architecture/ard-mvp.md §7.1
 * @see backend/app/core/platform_presets.py
 * @see Story PX-020
 */

/**
 * String-literal union of every MVP platform preset id.
 *
 * @remarks
 * `'custom'` is reserved for user-defined canvases and has 0×0 dimensions.
 * Consumers that apply a preset must branch on `'custom'` and avoid calling
 * `CanvasService.resize`.
 */
export type PlatformType =
  | 'ig-post'
  | 'ig-story'
  | 'linkedin-post'
  | 'linkedin-banner'
  | 'yt-thumb'
  | 'custom';

/**
 * Shape of one platform preset record.
 *
 * @remarks
 * Keep this interface in lock-step with `backend/app/core/platform_presets.py`
 * (the `PlatformPreset` dataclass / pydantic model).
 */
export interface PlatformPreset {
  /** Stable identifier used in URLs, DB documents, and the parity guard. */
  id: PlatformType;
  /** Human-readable label shown in UI (gallery tile, export dialog, etc.). */
  label: string;
  /** Canvas width in device-independent pixels. `0` for `'custom'`. */
  width: number;
  /** Canvas height in device-independent pixels. `0` for `'custom'`. */
  height: number;
  /** Aspect ratio as a display string (e.g. `'1:1'`, `'16:9'`). */
  aspect: string;
  /** Optional Material icon ligature for UI affordances. */
  icon?: string;
}

/**
 * The canonical ordered list of platform presets for MVP.
 *
 * @remarks
 * Readonly at compile time so callers cannot mutate the shared array.
 * Order matters: this is the order the UI renders presets in.
 *
 * @example
 * ```ts
 * import { PLATFORM_PRESETS, getPlatformPreset } from './platform-presets';
 *
 * const ig = getPlatformPreset('ig-post');
 * // -> { id: 'ig-post', width: 1080, height: 1080, ... }
 * ```
 */
export const PLATFORM_PRESETS: readonly PlatformPreset[] = [
  { id: 'ig-post', label: 'Instagram Post', width: 1080, height: 1080, aspect: '1:1', icon: 'camera_alt' },
  { id: 'ig-story', label: 'Instagram Story', width: 1080, height: 1920, aspect: '9:16', icon: 'photo_camera' },
  { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627, aspect: '1.91:1', icon: 'work' },
  { id: 'linkedin-banner', label: 'LinkedIn Banner', width: 1584, height: 396, aspect: '4:1', icon: 'view_carousel' },
  { id: 'yt-thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, aspect: '16:9', icon: 'smart_display' },
  { id: 'custom', label: 'Custom', width: 0, height: 0, aspect: 'custom', icon: 'tune' },
] as const;

/**
 * Look up a platform preset by id.
 *
 * @param id - The {@link PlatformType} id to look up.
 * @returns The matching {@link PlatformPreset}, or `undefined` if none matches.
 *
 * @example
 * ```ts
 * const preset = getPlatformPreset('yt-thumb');
 * if (preset) canvasService.resize(preset.width, preset.height);
 * ```
 */
export function getPlatformPreset(id: string | null | undefined): PlatformPreset | undefined {
  if (!id) return undefined;
  return PLATFORM_PRESETS.find((p) => p.id === id);
}
