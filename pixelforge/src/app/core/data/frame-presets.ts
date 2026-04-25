/**
 * Frame-layout presets for the collage feature (PX-090).
 *
 * Each preset describes N rectangular slots in a normalized coordinate
 * space `[0, 1]` × `[0, 1]`. At insert time the slots are multiplied by
 * 80% of the canvas dimensions and centered, so the same preset works
 * across every platform size (square IG post, vertical story, ultra-wide
 * banner) without per-preset recomputation.
 *
 * @see Story PX-090
 */

export interface FrameSlot {
  /** X of the slot's top-left, normalized to canvas width (0..1). */
  x: number;
  /** Y of the slot's top-left, normalized to canvas height (0..1). */
  y: number;
  /** Slot width, normalized to canvas width (0..1). */
  w: number;
  /** Slot height, normalized to canvas height (0..1). */
  h: number;
  /** Optional rotation in degrees (defaults to 0). Used by polaroid scatter. */
  rotation?: number;
}

export interface FramePreset {
  /** Stable identifier used in tests, analytics, and DOM `data-` attributes. */
  id: string;
  /** Human-readable label rendered on the sidebar card. */
  name: string;
  /** Material icon ligature for the card's leading glyph. */
  icon: string;
  /** Ordered list of frame slots. Length determines how many photos this preset holds. */
  slots: ReadonlyArray<FrameSlot>;
}

const GAP = 0.02; // small gap between slots so they don't merge visually

/**
 * Curated MVP collage layouts. 8 presets cover the most-requested
 * arrangements: 2-up splits (horizontal + vertical), triptych, 2x2 grid,
 * two magazine asymmetric layouts (1+2 and 2+1), polaroid scatter, and
 * a horizontal strip-3.
 *
 * @remarks
 * Order is load-bearing for the sidebar card grid — first preset shown
 * top-left. New presets append to the tail to preserve muscle memory.
 */
export const FRAME_PRESETS: ReadonlyArray<FramePreset> = [
  {
    id: 'split-2-h',
    name: 'Split 2 (horizontal)',
    icon: 'view_column',
    slots: [
      { x: 0, y: 0, w: 0.5 - GAP / 2, h: 1 },
      { x: 0.5 + GAP / 2, y: 0, w: 0.5 - GAP / 2, h: 1 },
    ],
  },
  {
    id: 'split-2-v',
    name: 'Split 2 (vertical)',
    icon: 'view_agenda',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 1, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    icon: 'view_week',
    slots: [
      { x: 0, y: 0, w: (1 - 2 * GAP) / 3, h: 1 },
      { x: (1 - 2 * GAP) / 3 + GAP, y: 0, w: (1 - 2 * GAP) / 3, h: 1 },
      { x: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, y: 0, w: (1 - 2 * GAP) / 3, h: 1 },
    ],
  },
  {
    id: 'grid-2x2',
    name: '2 × 2 grid',
    icon: 'grid_view',
    slots: [
      { x: 0, y: 0, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'magazine-1-plus-2',
    name: '1 + 2',
    icon: 'view_quilt',
    slots: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 - GAP / 2 },
      { x: 0.62, y: 0.5 + GAP / 2, w: 0.38, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'magazine-2-plus-1',
    name: '2 + 1',
    icon: 'view_quilt',
    slots: [
      { x: 0, y: 0, w: 0.38, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 0.38, h: 0.5 - GAP / 2 },
      { x: 0.4, y: 0, w: 0.6, h: 1 },
    ],
  },
  {
    id: 'polaroid-scatter',
    name: 'Polaroid scatter',
    icon: 'photo_library',
    slots: [
      { x: 0.05, y: 0.10, w: 0.42, h: 0.42, rotation: -8 },
      { x: 0.50, y: 0.05, w: 0.42, h: 0.42, rotation: 6 },
      { x: 0.10, y: 0.52, w: 0.42, h: 0.42, rotation: 4 },
      { x: 0.55, y: 0.55, w: 0.42, h: 0.42, rotation: -3 },
    ],
  },
  {
    id: 'strip-3-h',
    name: 'Strip of 3',
    icon: 'view_array',
    slots: [
      { x: 0, y: 0.30, w: (1 - 2 * GAP) / 3, h: 0.40 },
      { x: (1 - 2 * GAP) / 3 + GAP, y: 0.30, w: (1 - 2 * GAP) / 3, h: 0.40 },
      { x: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, y: 0.30, w: (1 - 2 * GAP) / 3, h: 0.40 },
    ],
  },
];

/**
 * Look up a preset by id.
 *
 * @param id - The preset id (e.g. `"grid-2x2"`).
 * @returns The matching preset or `undefined` when no match.
 */
export function getFramePreset(id: string): FramePreset | undefined {
  return FRAME_PRESETS.find(p => p.id === id);
}
