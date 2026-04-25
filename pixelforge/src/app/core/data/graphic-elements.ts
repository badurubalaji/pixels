/**
 * License-clean graphic-element SVGs (PX-126).
 *
 * @remarks
 * All SVGs in this file are hand-authored from primitive geometric paths
 * (no copy-paste from third-party stock libraries) so the catalogue is
 * unambiguously safe to bundle. Lucide-style stroke icons are MIT, but
 * we keep all of these inline + custom so we never have to chase a
 * license audit later.
 *
 * The user-flagged categories were: **modern, Indian traditional,
 * flowers, animals**. Each entry is a complete `<svg>` string with a
 * 0..100 viewBox — same convention as `stock-icons.ts` so the existing
 * sidebar render path can drop these in without modification.
 *
 * Add new entries by appending to {@link GRAPHIC_ELEMENTS}; the sidebar
 * groups by `category` automatically.
 */

export interface GraphicElement {
  name: string;
  category: 'modern' | 'indian' | 'flowers' | 'animals';
  svg: string;
}

const wrap = (inner: string, viewBox = '0 0 100 100') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`;

export const GRAPHIC_ELEMENTS: ReadonlyArray<GraphicElement> = [
  // ===========================
  // MODERN — abstract / geometric / minimalist (PX-126)
  // ===========================
  {
    name: 'Wave',
    category: 'modern',
    svg: wrap(
      '<path d="M0 50 Q 25 10 50 50 T 100 50 L 100 100 L 0 100 Z" fill="#7c3aed"/>',
    ),
  },
  {
    name: 'Gradient blob',
    category: 'modern',
    svg: wrap(
      '<defs><radialGradient id="g1" cx="40%" cy="40%"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#06b6d4"/></radialGradient></defs>' +
      '<path d="M50 5 Q 95 25 90 60 Q 80 95 45 95 Q 5 85 10 50 Q 15 15 50 5 Z" fill="url(#g1)"/>',
    ),
  },
  {
    name: 'Stripes',
    category: 'modern',
    svg: wrap(
      '<rect x="0" y="20" width="100" height="8" fill="#7c3aed"/>' +
      '<rect x="0" y="40" width="100" height="8" fill="#a855f7"/>' +
      '<rect x="0" y="60" width="100" height="8" fill="#06b6d4"/>' +
      '<rect x="0" y="80" width="100" height="8" fill="#ec4899"/>',
    ),
  },
  {
    name: 'Triangle stack',
    category: 'modern',
    svg: wrap(
      '<polygon points="50,10 90,75 10,75" fill="#7c3aed" opacity="0.5"/>' +
      '<polygon points="50,30 80,80 20,80" fill="#06b6d4" opacity="0.7"/>' +
      '<polygon points="50,50 70,90 30,90" fill="#a855f7"/>',
    ),
  },
  {
    name: 'Concentric circles',
    category: 'modern',
    svg: wrap(
      '<circle cx="50" cy="50" r="45" fill="none" stroke="#7c3aed" stroke-width="2"/>' +
      '<circle cx="50" cy="50" r="32" fill="none" stroke="#a855f7" stroke-width="2"/>' +
      '<circle cx="50" cy="50" r="20" fill="none" stroke="#06b6d4" stroke-width="2"/>' +
      '<circle cx="50" cy="50" r="8" fill="#7c3aed"/>',
    ),
  },
  {
    name: 'Arrow up-right',
    category: 'modern',
    svg: wrap(
      '<path d="M20 80 L 80 20 M 50 20 L 80 20 L 80 50" fill="none" stroke="#7c3aed" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
    ),
  },
  {
    name: 'Burst',
    category: 'modern',
    svg: wrap(
      '<g fill="#f59e0b">' +
      '<polygon points="50,5 55,40 90,30 60,50 95,55 60,55 90,80 55,60 50,95 45,60 10,80 40,55 5,55 40,50 10,30 45,40"/>' +
      '</g>',
    ),
  },

  // ===========================
  // INDIAN TRADITIONAL — public-domain motifs (PX-126)
  // ===========================
  {
    name: 'Mandala',
    category: 'indian',
    svg: wrap(
      '<g fill="none" stroke="#c2410c" stroke-width="1.5">' +
      '<circle cx="50" cy="50" r="45"/>' +
      '<circle cx="50" cy="50" r="35"/>' +
      '<circle cx="50" cy="50" r="22"/>' +
      '<circle cx="50" cy="50" r="10"/>' +
      // 8-petal flower at center
      '<path d="M50 8 C 55 25 55 25 50 50 C 45 25 45 25 50 8 Z"/>' +
      '<path d="M50 92 C 55 75 55 75 50 50 C 45 75 45 75 50 92 Z"/>' +
      '<path d="M8 50 C 25 55 25 55 50 50 C 25 45 25 45 8 50 Z"/>' +
      '<path d="M92 50 C 75 55 75 55 50 50 C 75 45 75 45 92 50 Z"/>' +
      '<path d="M21 21 C 33 30 33 30 50 50 C 30 33 30 33 21 21 Z"/>' +
      '<path d="M79 21 C 70 33 70 33 50 50 C 67 33 67 33 79 21 Z"/>' +
      '<path d="M21 79 C 33 70 33 70 50 50 C 30 67 30 67 21 79 Z"/>' +
      '<path d="M79 79 C 67 67 67 67 50 50 C 70 67 70 67 79 79 Z"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="3" fill="#dc2626"/>',
    ),
  },
  {
    name: 'Lotus',
    category: 'indian',
    svg: wrap(
      '<g fill="#ec4899" opacity="0.85">' +
      '<ellipse cx="50" cy="50" rx="10" ry="35" transform="rotate(-60 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="10" ry="35" transform="rotate(-30 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="10" ry="35"/>' +
      '<ellipse cx="50" cy="50" rx="10" ry="35" transform="rotate(30 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="10" ry="35" transform="rotate(60 50 50)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#fbbf24"/>',
    ),
  },
  {
    name: 'Paisley',
    category: 'indian',
    svg: wrap(
      '<path d="M30 80 C 20 60 25 30 55 20 C 80 15 85 45 65 60 C 50 70 45 55 55 45 C 60 40 50 35 45 45 C 40 60 50 75 60 75" ' +
      'fill="#9333ea" stroke="#581c87" stroke-width="1.5"/>' +
      '<circle cx="55" cy="35" r="4" fill="#581c87"/>',
    ),
  },
  {
    name: 'Diya (oil lamp)',
    category: 'indian',
    svg: wrap(
      '<path d="M15 65 Q 50 90 85 65 Q 80 75 50 78 Q 20 75 15 65 Z" fill="#b45309"/>' +
      '<path d="M40 65 Q 50 50 60 65 Z" fill="#b45309"/>' +
      '<path d="M48 35 Q 45 50 50 60 Q 55 50 52 35 Q 50 25 48 35 Z" fill="#fbbf24"/>' +
      '<path d="M48 25 Q 50 15 52 25 Q 50 18 48 25 Z" fill="#f59e0b"/>',
    ),
  },
  {
    name: 'Om',
    category: 'indian',
    svg: wrap(
      '<g fill="#c2410c">' +
      // Stylized om character — geometric approximation, not a font glyph
      '<path d="M30 60 C 20 60 15 70 25 75 C 35 78 50 75 50 60 C 50 50 40 50 35 55 Z"/>' +
      '<path d="M50 60 C 50 45 65 40 70 50 C 75 60 65 65 60 60 Z"/>' +
      '<path d="M65 30 Q 75 25 80 35 Q 75 45 65 40 Z"/>' +
      '<circle cx="75" cy="20" r="4"/>' +
      '<path d="M70 12 Q 78 6 85 12 Q 80 18 75 14 Z"/>' +
      '</g>',
    ),
  },
  {
    name: 'Rangoli star',
    category: 'indian',
    svg: wrap(
      '<g fill="#dc2626">' +
      '<polygon points="50,10 60,40 90,40 65,60 75,90 50,72 25,90 35,60 10,40 40,40"/>' +
      '</g>' +
      '<polygon points="50,25 56,42 75,42 60,55 65,72 50,62 35,72 40,55 25,42 44,42" fill="#fbbf24"/>' +
      '<circle cx="50" cy="50" r="5" fill="#dc2626"/>',
    ),
  },
  {
    name: 'Peacock feather',
    category: 'indian',
    svg: wrap(
      '<ellipse cx="50" cy="40" rx="20" ry="30" fill="#0891b2"/>' +
      '<ellipse cx="50" cy="35" rx="15" ry="22" fill="#06b6d4"/>' +
      '<ellipse cx="50" cy="30" rx="10" ry="15" fill="#22d3ee"/>' +
      '<ellipse cx="50" cy="28" rx="6" ry="9" fill="#fbbf24"/>' +
      '<circle cx="50" cy="28" r="3" fill="#7c2d12"/>' +
      '<line x1="50" y1="65" x2="50" y2="95" stroke="#065f46" stroke-width="2"/>',
    ),
  },

  // ===========================
  // FLOWERS (PX-126)
  // ===========================
  {
    name: 'Daisy',
    category: 'flowers',
    svg: wrap(
      '<g fill="#fef3c7">' +
      '<ellipse cx="50" cy="20" rx="8" ry="18"/>' +
      '<ellipse cx="50" cy="80" rx="8" ry="18"/>' +
      '<ellipse cx="20" cy="50" rx="18" ry="8"/>' +
      '<ellipse cx="80" cy="50" rx="18" ry="8"/>' +
      '<ellipse cx="29" cy="29" rx="8" ry="18" transform="rotate(-45 29 29)"/>' +
      '<ellipse cx="71" cy="29" rx="8" ry="18" transform="rotate(45 71 29)"/>' +
      '<ellipse cx="29" cy="71" rx="8" ry="18" transform="rotate(45 29 71)"/>' +
      '<ellipse cx="71" cy="71" rx="8" ry="18" transform="rotate(-45 71 71)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="10" fill="#f59e0b"/>',
    ),
  },
  {
    name: 'Tulip',
    category: 'flowers',
    svg: wrap(
      '<path d="M30 35 Q 30 15 50 15 Q 50 35 50 35 Z" fill="#e11d48"/>' +
      '<path d="M50 15 Q 50 35 50 35 Q 70 35 70 15 Q 50 25 50 15 Z" fill="#be123c"/>' +
      '<path d="M30 35 Q 50 50 70 35 L 70 50 Q 50 60 30 50 Z" fill="#9f1239"/>' +
      '<line x1="50" y1="50" x2="50" y2="90" stroke="#15803d" stroke-width="3"/>' +
      '<path d="M50 70 Q 60 65 65 75" fill="none" stroke="#15803d" stroke-width="3"/>',
    ),
  },
  {
    name: 'Rose',
    category: 'flowers',
    svg: wrap(
      '<g fill="#dc2626">' +
      '<circle cx="50" cy="50" r="28"/>' +
      '<path d="M50 50 Q 35 35 50 25 Q 65 35 50 50 Z" fill="#991b1b"/>' +
      '<path d="M50 50 Q 35 65 50 75 Q 65 65 50 50 Z" fill="#991b1b"/>' +
      '<path d="M50 50 Q 25 50 35 30 Q 50 35 50 50 Z" fill="#b91c1c"/>' +
      '<path d="M50 50 Q 75 50 65 30 Q 50 35 50 50 Z" fill="#b91c1c"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#7f1d1d"/>',
    ),
  },
  {
    name: 'Sunflower',
    category: 'flowers',
    svg: wrap(
      '<g fill="#fbbf24">' +
      '<ellipse cx="50" cy="20" rx="8" ry="15"/>' +
      '<ellipse cx="50" cy="80" rx="8" ry="15"/>' +
      '<ellipse cx="20" cy="50" rx="15" ry="8"/>' +
      '<ellipse cx="80" cy="50" rx="15" ry="8"/>' +
      '<ellipse cx="30" cy="30" rx="8" ry="15" transform="rotate(-45 30 30)"/>' +
      '<ellipse cx="70" cy="30" rx="8" ry="15" transform="rotate(45 70 30)"/>' +
      '<ellipse cx="30" cy="70" rx="8" ry="15" transform="rotate(45 30 70)"/>' +
      '<ellipse cx="70" cy="70" rx="8" ry="15" transform="rotate(-45 70 70)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="14" fill="#78350f"/>' +
      '<circle cx="50" cy="50" r="10" fill="#92400e"/>',
    ),
  },
  {
    name: 'Cherry blossom',
    category: 'flowers',
    svg: wrap(
      '<g fill="#fbcfe8">' +
      '<path d="M50 20 Q 60 30 50 45 Q 40 30 50 20 Z"/>' +
      '<path d="M50 80 Q 40 70 50 55 Q 60 70 50 80 Z"/>' +
      '<path d="M20 50 Q 30 40 45 50 Q 30 60 20 50 Z"/>' +
      '<path d="M80 50 Q 70 60 55 50 Q 70 40 80 50 Z"/>' +
      '<path d="M28 28 Q 38 28 45 45 Q 28 38 28 28 Z"/>' +
      '<path d="M72 28 Q 62 28 55 45 Q 72 38 72 28 Z"/>' +
      '<path d="M28 72 Q 38 72 45 55 Q 28 62 28 72 Z"/>' +
      '<path d="M72 72 Q 62 72 55 55 Q 72 62 72 72 Z"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#f472b6"/>',
    ),
  },

  // ===========================
  // ANIMALS (PX-126)
  // ===========================
  {
    name: 'Cat',
    category: 'animals',
    svg: wrap(
      // Head
      '<circle cx="50" cy="55" r="32" fill="#374151"/>' +
      // Ears
      '<polygon points="22,40 28,15 42,30" fill="#374151"/>' +
      '<polygon points="78,40 72,15 58,30" fill="#374151"/>' +
      '<polygon points="26,32 28,22 36,28" fill="#fda4af"/>' +
      '<polygon points="74,32 72,22 64,28" fill="#fda4af"/>' +
      // Eyes
      '<ellipse cx="40" cy="55" rx="3" ry="6" fill="#fbbf24"/>' +
      '<ellipse cx="60" cy="55" rx="3" ry="6" fill="#fbbf24"/>' +
      '<ellipse cx="40" cy="55" rx="1" ry="5" fill="#000"/>' +
      '<ellipse cx="60" cy="55" rx="1" ry="5" fill="#000"/>' +
      // Nose + mouth
      '<polygon points="50,68 47,72 53,72" fill="#fda4af"/>' +
      '<path d="M50 72 Q 45 78 42 75 M 50 72 Q 55 78 58 75" fill="none" stroke="#000" stroke-width="1"/>',
    ),
  },
  {
    name: 'Dog',
    category: 'animals',
    svg: wrap(
      // Head
      '<ellipse cx="50" cy="55" rx="30" ry="28" fill="#a16207"/>' +
      // Ears
      '<ellipse cx="22" cy="35" rx="7" ry="14" transform="rotate(-30 22 35)" fill="#854d0e"/>' +
      '<ellipse cx="78" cy="35" rx="7" ry="14" transform="rotate(30 78 35)" fill="#854d0e"/>' +
      // Snout
      '<ellipse cx="50" cy="68" rx="14" ry="10" fill="#fef3c7"/>' +
      // Eyes
      '<circle cx="40" cy="50" r="3" fill="#000"/>' +
      '<circle cx="60" cy="50" r="3" fill="#000"/>' +
      // Nose
      '<ellipse cx="50" cy="62" rx="4" ry="3" fill="#000"/>' +
      // Mouth
      '<path d="M50 68 L 50 75 M 50 75 Q 44 78 42 73 M 50 75 Q 56 78 58 73" fill="none" stroke="#000" stroke-width="1.5"/>',
    ),
  },
  {
    name: 'Bird',
    category: 'animals',
    svg: wrap(
      // Body
      '<ellipse cx="55" cy="55" rx="25" ry="20" fill="#0891b2"/>' +
      // Head
      '<circle cx="35" cy="40" r="14" fill="#06b6d4"/>' +
      // Beak
      '<polygon points="20,40 28,38 28,44" fill="#f59e0b"/>' +
      // Eye
      '<circle cx="32" cy="38" r="2" fill="#000"/>' +
      // Wing
      '<path d="M50 50 Q 65 50 75 65 Q 60 70 50 60 Z" fill="#0e7490"/>' +
      // Tail
      '<polygon points="78,55 92,50 90,60 92,65" fill="#0e7490"/>' +
      // Legs
      '<line x1="50" y1="73" x2="50" y2="85" stroke="#f59e0b" stroke-width="2"/>' +
      '<line x1="60" y1="73" x2="60" y2="85" stroke="#f59e0b" stroke-width="2"/>',
    ),
  },
  {
    name: 'Butterfly',
    category: 'animals',
    svg: wrap(
      // Body
      '<ellipse cx="50" cy="50" rx="3" ry="25" fill="#1e293b"/>' +
      // Wings — left top
      '<ellipse cx="30" cy="40" rx="20" ry="18" fill="#a855f7" opacity="0.9"/>' +
      '<ellipse cx="30" cy="40" rx="10" ry="9" fill="#fbbf24"/>' +
      // Wings — right top
      '<ellipse cx="70" cy="40" rx="20" ry="18" fill="#a855f7" opacity="0.9"/>' +
      '<ellipse cx="70" cy="40" rx="10" ry="9" fill="#fbbf24"/>' +
      // Wings — left bottom
      '<ellipse cx="32" cy="65" rx="14" ry="14" fill="#7c3aed" opacity="0.9"/>' +
      // Wings — right bottom
      '<ellipse cx="68" cy="65" rx="14" ry="14" fill="#7c3aed" opacity="0.9"/>' +
      // Antennae
      '<path d="M50 28 Q 45 18 40 18 M 50 28 Q 55 18 60 18" fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>',
    ),
  },
  {
    name: 'Fish',
    category: 'animals',
    svg: wrap(
      // Body
      '<ellipse cx="48" cy="50" rx="32" ry="18" fill="#06b6d4"/>' +
      // Tail
      '<polygon points="80,50 95,30 90,50 95,70" fill="#0891b2"/>' +
      // Eye
      '<circle cx="32" cy="46" r="4" fill="#fff"/>' +
      '<circle cx="32" cy="46" r="2" fill="#000"/>' +
      // Fin
      '<path d="M48 35 Q 55 20 62 35 Z" fill="#0e7490"/>' +
      // Lower fin
      '<path d="M40 65 Q 45 78 55 65 Z" fill="#0e7490"/>' +
      // Stripes
      '<path d="M55 40 Q 55 60 60 60" fill="none" stroke="#0e7490" stroke-width="2"/>' +
      '<path d="M65 38 Q 65 62 70 62" fill="none" stroke="#0e7490" stroke-width="2"/>',
    ),
  },
  {
    name: 'Owl',
    category: 'animals',
    svg: wrap(
      // Body
      '<ellipse cx="50" cy="55" rx="28" ry="32" fill="#78350f"/>' +
      // Head ear-tufts
      '<polygon points="32,28 38,12 42,28" fill="#78350f"/>' +
      '<polygon points="68,28 62,12 58,28" fill="#78350f"/>' +
      // Eye discs
      '<circle cx="40" cy="40" r="10" fill="#fef3c7"/>' +
      '<circle cx="60" cy="40" r="10" fill="#fef3c7"/>' +
      // Pupils
      '<circle cx="40" cy="40" r="5" fill="#000"/>' +
      '<circle cx="60" cy="40" r="5" fill="#000"/>' +
      '<circle cx="42" cy="38" r="1.5" fill="#fff"/>' +
      '<circle cx="62" cy="38" r="1.5" fill="#fff"/>' +
      // Beak
      '<polygon points="50,52 47,60 53,60" fill="#f59e0b"/>' +
      // Wing chevrons
      '<path d="M30 60 Q 35 70 40 60 Q 45 70 50 60 Q 55 70 60 60 Q 65 70 70 60" fill="none" stroke="#451a03" stroke-width="1.5"/>',
    ),
  },
];

/**
 * Display labels per category for the sidebar grouping (PX-126).
 *
 * @remarks
 * Order is load-bearing — sidebar renders sections in this order. Add new
 * categories by extending the type union AND this list.
 */
export const GRAPHIC_ELEMENT_CATEGORY_LABELS: ReadonlyArray<{
  id: GraphicElement['category'];
  label: string;
}> = [
  { id: 'modern', label: 'Modern' },
  { id: 'indian', label: 'Indian traditional' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'animals', label: 'Animals' },
];

/**
 * Group {@link GRAPHIC_ELEMENTS} by category in the canonical order.
 */
export function getGraphicElementsByCategory(): ReadonlyArray<{
  id: GraphicElement['category'];
  label: string;
  items: ReadonlyArray<GraphicElement>;
}> {
  return GRAPHIC_ELEMENT_CATEGORY_LABELS.map(({ id, label }) => ({
    id,
    label,
    items: GRAPHIC_ELEMENTS.filter(e => e.category === id),
  }));
}
