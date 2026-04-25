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

/**
 * Shape of the frame's clip mask (PX-102).
 *
 * @remarks
 * Each shape draws the frame's outline as a placeholder and clips the
 * filled photo to the same shape. Sized to fit the slot's bounding
 * rectangle (`width × height`) — the shape's intrinsic aspect ratio is
 * preserved by centering / contain-fitting within that box.
 *
 * - `rect` — default; rectangular slot (matches PX-090/091/094 behavior).
 * - `rounded` — rectangle with rx/ry = min(w,h)*0.12 corner radius.
 * - `circle` — ellipse fitting the bounding rectangle (circle when w==h).
 * - `hexagon` — regular hexagon, point-up.
 * - `star` — 5-pointed star inscribed in the bounding rectangle.
 * - `heart` — heart silhouette (SVG path) sized to the bounding box.
 */
export type FrameShape =
  | 'rect'
  | 'rounded'
  | 'circle'
  | 'hexagon'
  | 'star'
  | 'heart'
  | 'phone'           // PX-124: portrait phone outline with rounded corners
  | 'phone-landscape' // PX-124: landscape phone outline (laptop-ish, 16:10)
  | 'polaroid'        // PX-124: thick white border around the photo
  | 'torn-paper'      // PX-124: irregular bottom edge
  ;

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
  /** Optional clip shape; defaults to `'rect'` when omitted (PX-102). */
  shape?: FrameShape;
}

/**
 * Sub-category a preset belongs to (PX-121). Drives the section grouping
 * in the sidebar Frames panel so designers can scan related layouts
 * faster than scrolling one flat list.
 *
 * - `grids`     — multi-slot rectangular grids (splits, 2×2, magazine).
 * - `strips`    — N-panel filmstrip-style horizontal or vertical bands.
 * - `polaroid`  — scattered / overlapping rotated photo cards.
 * - `featured`  — asymmetric "hero + supporting" arrangements.
 * - `shapes`    — single-slot non-rectangular silhouettes.
 */
export type FrameCategory =
  | 'grids'
  | 'strips'
  | 'polaroid'
  | 'featured'
  | 'shapes'
  | 'devices'   // PX-124: phone / laptop outline frames
  | 'paper';    // PX-124: polaroid card / torn-paper artistic frames

export interface FramePreset {
  /** Stable identifier used in tests, analytics, and DOM `data-` attributes. */
  id: string;
  /** Human-readable label rendered on the sidebar card. */
  name: string;
  /** Material icon ligature for the card's leading glyph. */
  icon: string;
  /** Ordered list of frame slots. Length determines how many photos this preset holds. */
  slots: ReadonlyArray<FrameSlot>;
  /** PX-121 — sub-category for sidebar grouping. */
  category: FrameCategory;
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
  // ===========================
  // Category: grids (PX-090 + PX-121)
  // ===========================
  {
    id: 'split-2-h',
    name: 'Split 2 (horizontal)',
    icon: 'view_column',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 0.5 - GAP / 2, h: 1 },
      { x: 0.5 + GAP / 2, y: 0, w: 0.5 - GAP / 2, h: 1 },
    ],
  },
  {
    id: 'split-2-v',
    name: 'Split 2 (vertical)',
    icon: 'view_agenda',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 1, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    icon: 'view_week',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: (1 - 2 * GAP) / 3, h: 1 },
      { x: (1 - 2 * GAP) / 3 + GAP, y: 0, w: (1 - 2 * GAP) / 3, h: 1 },
      { x: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, y: 0, w: (1 - 2 * GAP) / 3, h: 1 },
    ],
  },
  // PX-121 — vertical stack of three (rotated triptych).
  {
    id: 'split-3-v',
    name: 'Split 3 (vertical)',
    icon: 'view_agenda',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 1, h: (1 - 2 * GAP) / 3 },
      { x: 0, y: (1 - 2 * GAP) / 3 + GAP, w: 1, h: (1 - 2 * GAP) / 3 },
      { x: 0, y: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, w: 1, h: (1 - 2 * GAP) / 3 },
    ],
  },
  {
    id: 'grid-2x2',
    name: '2 × 2 grid',
    icon: 'grid_view',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
    ],
  },
  // PX-121 — 2×3 (2 cols, 3 rows).
  {
    id: 'grid-2x3',
    name: '2 × 3 grid',
    icon: 'grid_view',
    category: 'grids',
    slots: (() => {
      const cw = 0.5 - GAP / 2;
      const rh = (1 - 2 * GAP) / 3;
      const slots: FrameSlot[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          slots.push({ x: c * (cw + GAP), y: r * (rh + GAP), w: cw, h: rh });
        }
      }
      return slots;
    })(),
  },
  // PX-121 — 3×3 (9-cell).
  {
    id: 'grid-3x3',
    name: '3 × 3 grid',
    icon: 'grid_on',
    category: 'grids',
    slots: (() => {
      const s = (1 - 2 * GAP) / 3;
      const slots: FrameSlot[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          slots.push({ x: c * (s + GAP), y: r * (s + GAP), w: s, h: s });
        }
      }
      return slots;
    })(),
  },
  {
    id: 'magazine-1-plus-2',
    name: '1 + 2',
    icon: 'view_quilt',
    category: 'grids',
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
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 0.38, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 0.38, h: 0.5 - GAP / 2 },
      { x: 0.4, y: 0, w: 0.6, h: 1 },
    ],
  },
  // PX-121 — big left + 3 small right.
  {
    id: 'magazine-1-plus-3',
    name: '1 + 3',
    icon: 'view_quilt',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: (1 - 2 * GAP) / 3 },
      { x: 0.62, y: (1 - 2 * GAP) / 3 + GAP, w: 0.38, h: (1 - 2 * GAP) / 3 },
      { x: 0.62, y: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, w: 0.38, h: (1 - 2 * GAP) / 3 },
    ],
  },
  // PX-121 — L-shape: hero top, 3-strip bottom.
  {
    id: 'quad-l',
    name: 'L-quad',
    icon: 'dashboard',
    category: 'grids',
    slots: [
      { x: 0, y: 0, w: 1, h: 0.6 - GAP / 2 },
      { x: 0, y: 0.6 + GAP / 2, w: (1 - 2 * GAP) / 3, h: 0.4 - GAP / 2 },
      { x: (1 - 2 * GAP) / 3 + GAP, y: 0.6 + GAP / 2, w: (1 - 2 * GAP) / 3, h: 0.4 - GAP / 2 },
      { x: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, y: 0.6 + GAP / 2, w: (1 - 2 * GAP) / 3, h: 0.4 - GAP / 2 },
    ],
  },

  // ===========================
  // Category: strips (PX-090 + PX-121)
  // ===========================
  // PX-121 — 2-panel filmstrip.
  {
    id: 'strip-2-h',
    name: 'Strip of 2',
    icon: 'view_array',
    category: 'strips',
    slots: [
      { x: 0, y: 0.30, w: 0.5 - GAP / 2, h: 0.40 },
      { x: 0.5 + GAP / 2, y: 0.30, w: 0.5 - GAP / 2, h: 0.40 },
    ],
  },
  {
    id: 'strip-3-h',
    name: 'Strip of 3',
    icon: 'view_array',
    category: 'strips',
    slots: [
      { x: 0, y: 0.30, w: (1 - 2 * GAP) / 3, h: 0.40 },
      { x: (1 - 2 * GAP) / 3 + GAP, y: 0.30, w: (1 - 2 * GAP) / 3, h: 0.40 },
      { x: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, y: 0.30, w: (1 - 2 * GAP) / 3, h: 0.40 },
    ],
  },
  // PX-121 — 4-panel filmstrip.
  {
    id: 'strip-4-h',
    name: 'Strip of 4',
    icon: 'view_array',
    category: 'strips',
    slots: (() => {
      const cw = (1 - 3 * GAP) / 4;
      return [0, 1, 2, 3].map(i => ({
        x: i * (cw + GAP),
        y: 0.30,
        w: cw,
        h: 0.40,
      }));
    })(),
  },
  // PX-121 — 3-panel vertical filmstrip.
  {
    id: 'strip-3-v',
    name: 'Vertical strip of 3',
    icon: 'view_array',
    category: 'strips',
    slots: [
      { x: 0.30, y: 0, w: 0.40, h: (1 - 2 * GAP) / 3 },
      { x: 0.30, y: (1 - 2 * GAP) / 3 + GAP, w: 0.40, h: (1 - 2 * GAP) / 3 },
      { x: 0.30, y: 2 * (1 - 2 * GAP) / 3 + 2 * GAP, w: 0.40, h: (1 - 2 * GAP) / 3 },
    ],
  },
  // PX-121 — 4-panel vertical filmstrip.
  {
    id: 'strip-4-v',
    name: 'Vertical strip of 4',
    icon: 'view_array',
    category: 'strips',
    slots: (() => {
      const rh = (1 - 3 * GAP) / 4;
      return [0, 1, 2, 3].map(i => ({
        x: 0.30,
        y: i * (rh + GAP),
        w: 0.40,
        h: rh,
      }));
    })(),
  },

  // ===========================
  // Category: polaroid (PX-090 + PX-121)
  // ===========================
  {
    id: 'polaroid-scatter',
    name: 'Polaroid scatter',
    icon: 'photo_library',
    category: 'polaroid',
    slots: [
      { x: 0.05, y: 0.10, w: 0.42, h: 0.42, rotation: -8 },
      { x: 0.50, y: 0.05, w: 0.42, h: 0.42, rotation: 6 },
      { x: 0.10, y: 0.52, w: 0.42, h: 0.42, rotation: 4 },
      { x: 0.55, y: 0.55, w: 0.42, h: 0.42, rotation: -3 },
    ],
  },
  // PX-121 — 3 polaroids in a row, slight alternating rotation.
  {
    id: 'polaroid-row',
    name: 'Polaroid row',
    icon: 'photo_library',
    category: 'polaroid',
    slots: [
      { x: 0.02, y: 0.30, w: 0.30, h: 0.40, rotation: -6 },
      { x: 0.35, y: 0.28, w: 0.30, h: 0.40, rotation: 3 },
      { x: 0.68, y: 0.32, w: 0.30, h: 0.40, rotation: -2 },
    ],
  },
  // PX-121 — overlapping stack (zoom-in feel).
  {
    id: 'polaroid-stack',
    name: 'Polaroid stack',
    icon: 'photo_library',
    category: 'polaroid',
    slots: [
      { x: 0.20, y: 0.20, w: 0.55, h: 0.55, rotation: -10 },
      { x: 0.25, y: 0.25, w: 0.55, h: 0.55, rotation: -2 },
      { x: 0.30, y: 0.30, w: 0.55, h: 0.55, rotation: 6 },
    ],
  },

  // ===========================
  // Category: featured (PX-121)
  // ===========================
  // PX-121 — hero center + 4 corners.
  {
    id: 'mosaic-feature',
    name: 'Hero + corners',
    icon: 'center_focus_strong',
    category: 'featured',
    slots: [
      { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
      { x: 0.00, y: 0.00, w: 0.22, h: 0.22 },
      { x: 0.78, y: 0.00, w: 0.22, h: 0.22 },
      { x: 0.00, y: 0.78, w: 0.22, h: 0.22 },
      { x: 0.78, y: 0.78, w: 0.22, h: 0.22 },
    ],
  },

  // ===========================
  // Category: shapes (PX-102)
  // ===========================
  {
    id: 'single-circle',
    name: 'Circle',
    icon: 'circle',
    category: 'shapes',
    slots: [{ x: 0.25, y: 0.25, w: 0.5, h: 0.5, shape: 'circle' }],
  },
  {
    id: 'single-rounded',
    name: 'Rounded square',
    icon: 'crop_5_4',
    category: 'shapes',
    slots: [{ x: 0.25, y: 0.25, w: 0.5, h: 0.5, shape: 'rounded' }],
  },
  {
    id: 'single-hexagon',
    name: 'Hexagon',
    icon: 'hexagon',
    category: 'shapes',
    slots: [{ x: 0.25, y: 0.25, w: 0.5, h: 0.5, shape: 'hexagon' }],
  },
  {
    id: 'single-star',
    name: 'Star',
    icon: 'star',
    category: 'shapes',
    slots: [{ x: 0.25, y: 0.25, w: 0.5, h: 0.5, shape: 'star' }],
  },
  {
    id: 'single-heart',
    name: 'Heart',
    icon: 'favorite',
    category: 'shapes',
    slots: [{ x: 0.25, y: 0.25, w: 0.5, h: 0.5, shape: 'heart' }],
  },

  // ===========================
  // Category: devices (PX-124)
  // ===========================
  {
    id: 'device-phone',
    name: 'Phone (portrait)',
    icon: 'phone_iphone',
    category: 'devices',
    slots: [{ x: 0.30, y: 0.10, w: 0.40, h: 0.80, shape: 'phone' }],
  },
  {
    id: 'device-phone-landscape',
    name: 'Phone (landscape)',
    icon: 'phone_android',
    category: 'devices',
    slots: [{ x: 0.10, y: 0.30, w: 0.80, h: 0.40, shape: 'phone-landscape' }],
  },
  {
    id: 'device-pair',
    name: 'Phone pair',
    icon: 'devices',
    category: 'devices',
    slots: [
      { x: 0.05, y: 0.15, w: 0.40, h: 0.70, shape: 'phone' },
      { x: 0.55, y: 0.15, w: 0.40, h: 0.70, shape: 'phone' },
    ],
  },

  // ===========================
  // Category: paper (PX-124)
  // ===========================
  {
    id: 'paper-polaroid-single',
    name: 'Polaroid card',
    icon: 'photo_camera_front',
    category: 'paper',
    slots: [{ x: 0.20, y: 0.10, w: 0.60, h: 0.80, shape: 'polaroid' }],
  },
  {
    id: 'paper-torn-single',
    name: 'Torn paper',
    icon: 'description',
    category: 'paper',
    slots: [{ x: 0.20, y: 0.20, w: 0.60, h: 0.60, shape: 'torn-paper' }],
  },
  {
    id: 'paper-torn-row',
    name: 'Torn paper row',
    icon: 'description',
    category: 'paper',
    slots: [
      { x: 0.04, y: 0.30, w: 0.30, h: 0.50, shape: 'torn-paper' },
      { x: 0.36, y: 0.30, w: 0.30, h: 0.50, shape: 'torn-paper' },
      { x: 0.68, y: 0.30, w: 0.30, h: 0.50, shape: 'torn-paper' },
    ],
  },
];

/**
 * Display labels for each category, used by the sidebar group headers.
 *
 * @remarks
 * Order is load-bearing — that's the order sections render in the panel.
 */
export const FRAME_CATEGORY_LABELS: ReadonlyArray<{ id: FrameCategory; label: string }> = [
  { id: 'grids', label: 'Grids' },
  { id: 'strips', label: 'Filmstrips' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'featured', label: 'Hero layouts' },
  { id: 'shapes', label: 'Shapes' },
  { id: 'devices', label: 'Devices' },
  { id: 'paper', label: 'Paper' },
];

/**
 * Group {@link FRAME_PRESETS} by category, preserving the in-array order
 * within each section (PX-121).
 *
 * @returns Sections in the canonical category order with their presets.
 */
export function getFramePresetsByCategory(): ReadonlyArray<{
  id: FrameCategory;
  label: string;
  presets: ReadonlyArray<FramePreset>;
}> {
  return FRAME_CATEGORY_LABELS.map(({ id, label }) => ({
    id,
    label,
    presets: FRAME_PRESETS.filter(p => p.category === id),
  }));
}

/**
 * Look up a preset by id.
 *
 * @param id - The preset id (e.g. `"grid-2x2"`).
 * @returns The matching preset or `undefined` when no match.
 */
export function getFramePreset(id: string): FramePreset | undefined {
  return FRAME_PRESETS.find(p => p.id === id);
}
