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
  /**
   * Sub-category for sidebar grouping (PX-126 + PX-128). Indian motifs
   * split into mandala / mandala-border / mural / mural-border /
   * indian-motifs after the user asked for more depth in those areas.
   */
  category:
    | 'modern'
    | 'mandala'
    | 'mandala-border'
    | 'mural'
    | 'mural-border'
    | 'indian-motifs'
    | 'flowers'
    | 'animals';
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
    category: 'mandala',
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
    category: 'indian-motifs',
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
    category: 'indian-motifs',
    svg: wrap(
      '<path d="M30 80 C 20 60 25 30 55 20 C 80 15 85 45 65 60 C 50 70 45 55 55 45 C 60 40 50 35 45 45 C 40 60 50 75 60 75" ' +
      'fill="#9333ea" stroke="#581c87" stroke-width="1.5"/>' +
      '<circle cx="55" cy="35" r="4" fill="#581c87"/>',
    ),
  },
  {
    name: 'Diya (oil lamp)',
    category: 'indian-motifs',
    svg: wrap(
      '<path d="M15 65 Q 50 90 85 65 Q 80 75 50 78 Q 20 75 15 65 Z" fill="#b45309"/>' +
      '<path d="M40 65 Q 50 50 60 65 Z" fill="#b45309"/>' +
      '<path d="M48 35 Q 45 50 50 60 Q 55 50 52 35 Q 50 25 48 35 Z" fill="#fbbf24"/>' +
      '<path d="M48 25 Q 50 15 52 25 Q 50 18 48 25 Z" fill="#f59e0b"/>',
    ),
  },
  {
    name: 'Om',
    category: 'indian-motifs',
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
    category: 'indian-motifs',
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
    category: 'indian-motifs',
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
  // MANDALA — circular meditation art (PX-128)
  // ===========================
  {
    name: 'Mandala — geometric',
    category: 'mandala',
    svg: wrap(
      '<g fill="none" stroke="#7c2d12" stroke-width="1.2">' +
      '<circle cx="50" cy="50" r="46"/>' +
      '<circle cx="50" cy="50" r="38"/>' +
      '<circle cx="50" cy="50" r="28"/>' +
      '<circle cx="50" cy="50" r="18"/>' +
      // 12 spokes
      '<g>' +
      '<line x1="50" y1="4" x2="50" y2="96"/>' +
      '<line x1="4" y1="50" x2="96" y2="50"/>' +
      '<line x1="14" y1="14" x2="86" y2="86"/>' +
      '<line x1="86" y1="14" x2="14" y2="86"/>' +
      '<line x1="27" y1="6" x2="73" y2="94"/>' +
      '<line x1="73" y1="6" x2="27" y2="94"/>' +
      '<line x1="6" y1="27" x2="94" y2="73"/>' +
      '<line x1="94" y1="27" x2="6" y2="73"/>' +
      '</g></g>' +
      '<circle cx="50" cy="50" r="6" fill="#dc2626"/>' +
      '<circle cx="50" cy="50" r="2" fill="#fbbf24"/>',
    ),
  },
  {
    name: 'Mandala — floral',
    category: 'mandala',
    svg: wrap(
      '<g fill="#f59e0b" opacity="0.85">' +
      // 8 outer petals
      '<ellipse cx="50" cy="20" rx="6" ry="14"/>' +
      '<ellipse cx="50" cy="80" rx="6" ry="14"/>' +
      '<ellipse cx="20" cy="50" rx="14" ry="6"/>' +
      '<ellipse cx="80" cy="50" rx="14" ry="6"/>' +
      '<ellipse cx="29" cy="29" rx="6" ry="14" transform="rotate(-45 29 29)"/>' +
      '<ellipse cx="71" cy="29" rx="6" ry="14" transform="rotate(45 71 29)"/>' +
      '<ellipse cx="29" cy="71" rx="6" ry="14" transform="rotate(45 29 71)"/>' +
      '<ellipse cx="71" cy="71" rx="6" ry="14" transform="rotate(-45 71 71)"/>' +
      '</g>' +
      '<g fill="#dc2626">' +
      '<ellipse cx="50" cy="35" rx="4" ry="10"/>' +
      '<ellipse cx="50" cy="65" rx="4" ry="10"/>' +
      '<ellipse cx="35" cy="50" rx="10" ry="4"/>' +
      '<ellipse cx="65" cy="50" rx="10" ry="4"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#fef3c7"/>' +
      '<circle cx="50" cy="50" r="2" fill="#7c2d12"/>',
    ),
  },
  {
    name: 'Mandala — sun rays',
    category: 'mandala',
    svg: wrap(
      '<g fill="#fbbf24">' +
      '<polygon points="50,5 53,30 47,30"/>' +
      '<polygon points="50,95 53,70 47,70"/>' +
      '<polygon points="5,50 30,53 30,47"/>' +
      '<polygon points="95,50 70,53 70,47"/>' +
      '<polygon points="20,20 38,32 32,38"/>' +
      '<polygon points="80,20 62,32 68,38"/>' +
      '<polygon points="20,80 38,68 32,62"/>' +
      '<polygon points="80,80 62,68 68,62"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="22" fill="#f59e0b"/>' +
      '<circle cx="50" cy="50" r="14" fill="#fbbf24"/>' +
      '<circle cx="50" cy="50" r="6" fill="#dc2626"/>',
    ),
  },
  {
    name: 'Mandala — lotus center',
    category: 'mandala',
    svg: wrap(
      '<g fill="none" stroke="#9333ea" stroke-width="1.2">' +
      '<circle cx="50" cy="50" r="48"/>' +
      '<circle cx="50" cy="50" r="36"/>' +
      '<circle cx="50" cy="50" r="22"/>' +
      '</g>' +
      '<g fill="#a855f7" opacity="0.85">' +
      '<ellipse cx="50" cy="50" rx="8" ry="22" transform="rotate(0 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="8" ry="22" transform="rotate(45 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="8" ry="22" transform="rotate(90 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="8" ry="22" transform="rotate(135 50 50)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#fbbf24"/>',
    ),
  },
  {
    name: 'Mandala — square frame',
    category: 'mandala',
    svg: wrap(
      '<g fill="none" stroke="#0891b2" stroke-width="1.5">' +
      '<rect x="6" y="6" width="88" height="88" rx="3"/>' +
      '<rect x="14" y="14" width="72" height="72" rx="2"/>' +
      '<polygon points="50,18 60,40 82,50 60,60 50,82 40,60 18,50 40,40"/>' +
      '<circle cx="50" cy="50" r="14"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#06b6d4"/>',
    ),
  },
  // PX-133 — additional mandalas inspired by the visual style of the
  // user-shared Freepik/PngTree references. Hand-authored from primitive
  // paths so we stay clear of those services' license terms (attribution
  // + no-redistribution). The intricacy is built up by layering 3-4
  // concentric rings of geometric or floral motifs around a center.
  {
    name: 'Mandala — dot work',
    category: 'mandala',
    svg: wrap(
      '<g fill="#7c2d12">' +
      // 16 outer dots evenly spaced
      '<circle cx="50" cy="6" r="1.6"/><circle cx="67" cy="9" r="1.6"/>' +
      '<circle cx="82" cy="18" r="1.6"/><circle cx="91" cy="33" r="1.6"/>' +
      '<circle cx="94" cy="50" r="1.6"/><circle cx="91" cy="67" r="1.6"/>' +
      '<circle cx="82" cy="82" r="1.6"/><circle cx="67" cy="91" r="1.6"/>' +
      '<circle cx="50" cy="94" r="1.6"/><circle cx="33" cy="91" r="1.6"/>' +
      '<circle cx="18" cy="82" r="1.6"/><circle cx="9" cy="67" r="1.6"/>' +
      '<circle cx="6" cy="50" r="1.6"/><circle cx="9" cy="33" r="1.6"/>' +
      '<circle cx="18" cy="18" r="1.6"/><circle cx="33" cy="9" r="1.6"/>' +
      '</g>' +
      '<g fill="none" stroke="#7c2d12" stroke-width="0.8">' +
      '<circle cx="50" cy="50" r="42"/>' +
      '<circle cx="50" cy="50" r="32"/>' +
      '<circle cx="50" cy="50" r="22"/>' +
      '</g>' +
      '<g fill="#dc2626">' +
      '<circle cx="50" cy="22" r="2.5"/><circle cx="50" cy="78" r="2.5"/>' +
      '<circle cx="22" cy="50" r="2.5"/><circle cx="78" cy="50" r="2.5"/>' +
      '<circle cx="30" cy="30" r="2.5"/><circle cx="70" cy="30" r="2.5"/>' +
      '<circle cx="30" cy="70" r="2.5"/><circle cx="70" cy="70" r="2.5"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="6" fill="#fbbf24"/>' +
      '<circle cx="50" cy="50" r="2" fill="#7c2d12"/>',
    ),
  },
  {
    name: 'Mandala — henna',
    category: 'mandala',
    svg: wrap(
      '<g fill="#9a3412" opacity="0.92">' +
      // 8 paisley-style petals around the center
      '<path d="M50 50 Q 60 30 50 10 Q 40 30 50 50" />' +
      '<path d="M50 50 Q 70 40 90 50 Q 70 60 50 50" />' +
      '<path d="M50 50 Q 60 70 50 90 Q 40 70 50 50" />' +
      '<path d="M50 50 Q 30 40 10 50 Q 30 60 50 50" />' +
      '<path d="M50 50 Q 65 35 78 22 Q 65 50 50 50" />' +
      '<path d="M50 50 Q 65 65 78 78 Q 50 65 50 50" />' +
      '<path d="M50 50 Q 35 65 22 78 Q 50 65 50 50" />' +
      '<path d="M50 50 Q 35 35 22 22 Q 50 35 50 50" />' +
      '</g>' +
      '<g fill="none" stroke="#9a3412" stroke-width="0.8">' +
      '<circle cx="50" cy="50" r="44"/>' +
      '<circle cx="50" cy="50" r="14"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="4" fill="#dc2626"/>',
    ),
  },
  {
    name: 'Mandala — star burst',
    category: 'mandala',
    svg: wrap(
      // Outer ring of triangle rays
      '<g fill="#f59e0b">' +
      '<polygon points="50,4 53,22 47,22"/>' +
      '<polygon points="68,8 64,26 58,22"/>' +
      '<polygon points="84,18 76,34 70,30"/>' +
      '<polygon points="92,32 78,42 74,36"/>' +
      '<polygon points="96,50 78,53 78,47"/>' +
      '<polygon points="92,68 78,58 74,64"/>' +
      '<polygon points="84,82 70,70 76,66"/>' +
      '<polygon points="68,92 58,78 64,74"/>' +
      '<polygon points="50,96 47,78 53,78"/>' +
      '<polygon points="32,92 36,74 42,78"/>' +
      '<polygon points="16,82 24,66 30,70"/>' +
      '<polygon points="8,68 22,64 26,68"/>' +
      '<polygon points="4,50 22,47 22,53"/>' +
      '<polygon points="8,32 22,36 26,42"/>' +
      '<polygon points="16,18 30,30 24,34"/>' +
      '<polygon points="32,8 42,22 36,26"/>' +
      '</g>' +
      // Middle ring (smaller petals)
      '<g fill="#dc2626">' +
      '<ellipse cx="50" cy="30" rx="3" ry="8"/>' +
      '<ellipse cx="50" cy="70" rx="3" ry="8"/>' +
      '<ellipse cx="30" cy="50" rx="8" ry="3"/>' +
      '<ellipse cx="70" cy="50" rx="8" ry="3"/>' +
      '<ellipse cx="35" cy="35" rx="3" ry="8" transform="rotate(-45 35 35)"/>' +
      '<ellipse cx="65" cy="35" rx="3" ry="8" transform="rotate(45 65 35)"/>' +
      '<ellipse cx="35" cy="65" rx="3" ry="8" transform="rotate(45 35 65)"/>' +
      '<ellipse cx="65" cy="65" rx="3" ry="8" transform="rotate(-45 65 65)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="10" fill="#fbbf24"/>' +
      '<circle cx="50" cy="50" r="4" fill="#7c2d12"/>',
    ),
  },
  {
    name: 'Mandala — chakra',
    category: 'mandala',
    svg: wrap(
      '<g fill="none" stroke="#9333ea" stroke-width="1.5">' +
      '<circle cx="50" cy="50" r="46"/>' +
      // 8 spokes
      '<line x1="50" y1="4" x2="50" y2="96"/>' +
      '<line x1="4" y1="50" x2="96" y2="50"/>' +
      '<line x1="17" y1="17" x2="83" y2="83"/>' +
      '<line x1="83" y1="17" x2="17" y2="83"/>' +
      '</g>' +
      // Spoke caps (lotus heads)
      '<g fill="#a855f7">' +
      '<circle cx="50" cy="8" r="5"/><circle cx="50" cy="92" r="5"/>' +
      '<circle cx="8" cy="50" r="5"/><circle cx="92" cy="50" r="5"/>' +
      '<circle cx="20" cy="20" r="5"/><circle cx="80" cy="20" r="5"/>' +
      '<circle cx="20" cy="80" r="5"/><circle cx="80" cy="80" r="5"/>' +
      '</g>' +
      '<g fill="#fbbf24">' +
      '<circle cx="50" cy="8" r="2"/><circle cx="50" cy="92" r="2"/>' +
      '<circle cx="8" cy="50" r="2"/><circle cx="92" cy="50" r="2"/>' +
      '<circle cx="20" cy="20" r="2"/><circle cx="80" cy="20" r="2"/>' +
      '<circle cx="20" cy="80" r="2"/><circle cx="80" cy="80" r="2"/>' +
      '</g>' +
      // Inner ring
      '<g fill="none" stroke="#9333ea" stroke-width="1">' +
      '<circle cx="50" cy="50" r="22"/>' +
      '</g>' +
      '<g fill="#a855f7">' +
      '<ellipse cx="50" cy="50" rx="3" ry="14"/>' +
      '<ellipse cx="50" cy="50" rx="3" ry="14" transform="rotate(45 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="3" ry="14" transform="rotate(90 50 50)"/>' +
      '<ellipse cx="50" cy="50" rx="3" ry="14" transform="rotate(135 50 50)"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="5" fill="#fbbf24"/>' +
      '<circle cx="50" cy="50" r="2" fill="#7c2d12"/>',
    ),
  },
  {
    name: 'Mandala — minimal',
    category: 'mandala',
    svg: wrap(
      '<g fill="none" stroke="#0f172a" stroke-width="1">' +
      '<circle cx="50" cy="50" r="44"/>' +
      '<circle cx="50" cy="50" r="36"/>' +
      '<circle cx="50" cy="50" r="14"/>' +
      // 12 thin spokes
      '<line x1="50" y1="6" x2="50" y2="36"/>' +
      '<line x1="50" y1="64" x2="50" y2="94"/>' +
      '<line x1="6" y1="50" x2="36" y2="50"/>' +
      '<line x1="64" y1="50" x2="94" y2="50"/>' +
      '<line x1="20" y1="20" x2="40" y2="40"/>' +
      '<line x1="80" y1="20" x2="60" y2="40"/>' +
      '<line x1="20" y1="80" x2="40" y2="60"/>' +
      '<line x1="80" y1="80" x2="60" y2="60"/>' +
      '<line x1="50" y1="14" x2="50" y2="22" stroke-width="2.5"/>' +
      '<line x1="50" y1="78" x2="50" y2="86" stroke-width="2.5"/>' +
      '<line x1="14" y1="50" x2="22" y2="50" stroke-width="2.5"/>' +
      '<line x1="78" y1="50" x2="86" y2="50" stroke-width="2.5"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="4" fill="#0f172a"/>',
    ),
  },
  {
    name: 'Mandala — flower of life',
    category: 'mandala',
    svg: wrap(
      // 7-circle "flower of life" pattern (sacred geometry)
      '<g fill="none" stroke="#7c3aed" stroke-width="1.2">' +
      '<circle cx="50" cy="50" r="20"/>' +
      '<circle cx="50" cy="30" r="20"/>' +
      '<circle cx="50" cy="70" r="20"/>' +
      '<circle cx="33" cy="40" r="20"/>' +
      '<circle cx="67" cy="40" r="20"/>' +
      '<circle cx="33" cy="60" r="20"/>' +
      '<circle cx="67" cy="60" r="20"/>' +
      '<circle cx="50" cy="50" r="44"/>' +
      '</g>' +
      '<circle cx="50" cy="50" r="3" fill="#7c3aed"/>',
    ),
  },

  // PX-133 — additional border variants matched to the user's references.
  {
    name: 'Mandala border — geometric chain',
    category: 'mandala-border',
    svg: wrap(
      '<line x1="0" y1="20" x2="100" y2="20" stroke="#7c2d12" stroke-width="1"/>' +
      '<line x1="0" y1="80" x2="100" y2="80" stroke="#7c2d12" stroke-width="1"/>' +
      '<g fill="none" stroke="#dc2626" stroke-width="1.2">' +
      // Repeating diamond+circle chain
      '<polygon points="10,30 20,50 10,70 0,50"/>' +
      '<circle cx="20" cy="50" r="6"/>' +
      '<polygon points="30,30 40,50 30,70 20,50"/>' +
      '<circle cx="40" cy="50" r="6"/>' +
      '<polygon points="50,30 60,50 50,70 40,50"/>' +
      '<circle cx="60" cy="50" r="6"/>' +
      '<polygon points="70,30 80,50 70,70 60,50"/>' +
      '<circle cx="80" cy="50" r="6"/>' +
      '<polygon points="90,30 100,50 90,70 80,50"/>' +
      '</g>' +
      '<g fill="#fbbf24">' +
      '<circle cx="20" cy="50" r="1.5"/>' +
      '<circle cx="40" cy="50" r="1.5"/>' +
      '<circle cx="60" cy="50" r="1.5"/>' +
      '<circle cx="80" cy="50" r="1.5"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mandala border — sun row',
    category: 'mandala-border',
    svg: wrap(
      '<line x1="0" y1="50" x2="100" y2="50" stroke="#9a3412" stroke-width="0.8"/>' +
      '<g fill="#fbbf24">' +
      '<circle cx="10" cy="50" r="6"/>' +
      '<circle cx="30" cy="50" r="6"/>' +
      '<circle cx="50" cy="50" r="6"/>' +
      '<circle cx="70" cy="50" r="6"/>' +
      '<circle cx="90" cy="50" r="6"/>' +
      '</g>' +
      '<g fill="none" stroke="#dc2626" stroke-width="0.8">' +
      // Sun rays around each circle
      '<g transform="translate(10 50)">' +
      '<line x1="0" y1="-9" x2="0" y2="-12"/>' +
      '<line x1="0" y1="9" x2="0" y2="12"/>' +
      '<line x1="-9" y1="0" x2="-12" y2="0"/>' +
      '<line x1="9" y1="0" x2="12" y2="0"/>' +
      '<line x1="-6" y1="-6" x2="-9" y2="-9"/>' +
      '<line x1="6" y1="-6" x2="9" y2="-9"/>' +
      '<line x1="-6" y1="6" x2="-9" y2="9"/>' +
      '<line x1="6" y1="6" x2="9" y2="9"/>' +
      '</g>' +
      '<g transform="translate(30 50)">' +
      '<line x1="0" y1="-9" x2="0" y2="-12"/>' +
      '<line x1="0" y1="9" x2="0" y2="12"/>' +
      '<line x1="-9" y1="0" x2="-12" y2="0"/>' +
      '<line x1="9" y1="0" x2="12" y2="0"/>' +
      '<line x1="-6" y1="-6" x2="-9" y2="-9"/>' +
      '<line x1="6" y1="-6" x2="9" y2="-9"/>' +
      '<line x1="-6" y1="6" x2="-9" y2="9"/>' +
      '<line x1="6" y1="6" x2="9" y2="9"/>' +
      '</g>' +
      '<g transform="translate(50 50)">' +
      '<line x1="0" y1="-9" x2="0" y2="-12"/>' +
      '<line x1="0" y1="9" x2="0" y2="12"/>' +
      '<line x1="-9" y1="0" x2="-12" y2="0"/>' +
      '<line x1="9" y1="0" x2="12" y2="0"/>' +
      '<line x1="-6" y1="-6" x2="-9" y2="-9"/>' +
      '<line x1="6" y1="-6" x2="9" y2="-9"/>' +
      '<line x1="-6" y1="6" x2="-9" y2="9"/>' +
      '<line x1="6" y1="6" x2="9" y2="9"/>' +
      '</g>' +
      '<g transform="translate(70 50)">' +
      '<line x1="0" y1="-9" x2="0" y2="-12"/>' +
      '<line x1="0" y1="9" x2="0" y2="12"/>' +
      '<line x1="-9" y1="0" x2="-12" y2="0"/>' +
      '<line x1="9" y1="0" x2="12" y2="0"/>' +
      '<line x1="-6" y1="-6" x2="-9" y2="-9"/>' +
      '<line x1="6" y1="-6" x2="9" y2="-9"/>' +
      '<line x1="-6" y1="6" x2="-9" y2="9"/>' +
      '<line x1="6" y1="6" x2="9" y2="9"/>' +
      '</g>' +
      '<g transform="translate(90 50)">' +
      '<line x1="0" y1="-9" x2="0" y2="-12"/>' +
      '<line x1="0" y1="9" x2="0" y2="12"/>' +
      '<line x1="-9" y1="0" x2="-12" y2="0"/>' +
      '<line x1="9" y1="0" x2="12" y2="0"/>' +
      '<line x1="-6" y1="-6" x2="-9" y2="-9"/>' +
      '<line x1="6" y1="-6" x2="9" y2="-9"/>' +
      '<line x1="-6" y1="6" x2="-9" y2="9"/>' +
      '<line x1="6" y1="6" x2="9" y2="9"/>' +
      '</g>' +
      '</g>' +
      '<g fill="#dc2626">' +
      '<circle cx="10" cy="50" r="2"/>' +
      '<circle cx="30" cy="50" r="2"/>' +
      '<circle cx="50" cy="50" r="2"/>' +
      '<circle cx="70" cy="50" r="2"/>' +
      '<circle cx="90" cy="50" r="2"/>' +
      '</g>',
    ),
  },

  // ===========================
  // MANDALA BORDERS — horizontal repeating decorative bands (PX-128)
  // ===========================
  {
    name: 'Mandala border — petals',
    category: 'mandala-border',
    svg: wrap(
      '<g fill="#f59e0b">' +
      '<circle cx="10" cy="50" r="10"/>' +
      '<circle cx="30" cy="50" r="10"/>' +
      '<circle cx="50" cy="50" r="10"/>' +
      '<circle cx="70" cy="50" r="10"/>' +
      '<circle cx="90" cy="50" r="10"/>' +
      '</g>' +
      '<g fill="#dc2626">' +
      '<circle cx="10" cy="50" r="4"/>' +
      '<circle cx="30" cy="50" r="4"/>' +
      '<circle cx="50" cy="50" r="4"/>' +
      '<circle cx="70" cy="50" r="4"/>' +
      '<circle cx="90" cy="50" r="4"/>' +
      '</g>' +
      '<line x1="0" y1="35" x2="100" y2="35" stroke="#7c2d12" stroke-width="1.5"/>' +
      '<line x1="0" y1="65" x2="100" y2="65" stroke="#7c2d12" stroke-width="1.5"/>',
    ),
  },
  {
    name: 'Mandala border — diamonds',
    category: 'mandala-border',
    svg: wrap(
      '<line x1="0" y1="40" x2="100" y2="40" stroke="#9333ea" stroke-width="1"/>' +
      '<line x1="0" y1="60" x2="100" y2="60" stroke="#9333ea" stroke-width="1"/>' +
      '<g fill="#a855f7">' +
      '<polygon points="10,30 16,50 10,70 4,50"/>' +
      '<polygon points="30,30 36,50 30,70 24,50"/>' +
      '<polygon points="50,30 56,50 50,70 44,50"/>' +
      '<polygon points="70,30 76,50 70,70 64,50"/>' +
      '<polygon points="90,30 96,50 90,70 84,50"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mandala border — vines',
    category: 'mandala-border',
    svg: wrap(
      '<path d="M0 50 Q 10 30 20 50 Q 30 70 40 50 Q 50 30 60 50 Q 70 70 80 50 Q 90 30 100 50" ' +
      'fill="none" stroke="#15803d" stroke-width="2" stroke-linecap="round"/>' +
      '<g fill="#dc2626">' +
      '<circle cx="20" cy="50" r="3"/>' +
      '<circle cx="40" cy="50" r="3"/>' +
      '<circle cx="60" cy="50" r="3"/>' +
      '<circle cx="80" cy="50" r="3"/>' +
      '</g>' +
      '<g fill="#15803d">' +
      '<ellipse cx="10" cy="35" rx="4" ry="2" transform="rotate(-30 10 35)"/>' +
      '<ellipse cx="30" cy="65" rx="4" ry="2" transform="rotate(30 30 65)"/>' +
      '<ellipse cx="50" cy="35" rx="4" ry="2" transform="rotate(-30 50 35)"/>' +
      '<ellipse cx="70" cy="65" rx="4" ry="2" transform="rotate(30 70 65)"/>' +
      '<ellipse cx="90" cy="35" rx="4" ry="2" transform="rotate(-30 90 35)"/>' +
      '</g>',
    ),
  },
  // PX-130 — additional continuous-pattern borders (Google ref: "mandala art border")
  {
    name: 'Mandala border — lotus chain',
    category: 'mandala-border',
    svg: wrap(
      '<line x1="0" y1="20" x2="100" y2="20" stroke="#7c2d12" stroke-width="1"/>' +
      '<line x1="0" y1="80" x2="100" y2="80" stroke="#7c2d12" stroke-width="1"/>' +
      '<g fill="#9333ea">' +
      // 5 lotus blooms in a row
      '<g transform="translate(10 50)"><ellipse rx="3" ry="14" transform="rotate(-30)"/><ellipse rx="3" ry="14"/><ellipse rx="3" ry="14" transform="rotate(30)"/></g>' +
      '<g transform="translate(30 50)"><ellipse rx="3" ry="14" transform="rotate(-30)"/><ellipse rx="3" ry="14"/><ellipse rx="3" ry="14" transform="rotate(30)"/></g>' +
      '<g transform="translate(50 50)"><ellipse rx="3" ry="14" transform="rotate(-30)"/><ellipse rx="3" ry="14"/><ellipse rx="3" ry="14" transform="rotate(30)"/></g>' +
      '<g transform="translate(70 50)"><ellipse rx="3" ry="14" transform="rotate(-30)"/><ellipse rx="3" ry="14"/><ellipse rx="3" ry="14" transform="rotate(30)"/></g>' +
      '<g transform="translate(90 50)"><ellipse rx="3" ry="14" transform="rotate(-30)"/><ellipse rx="3" ry="14"/><ellipse rx="3" ry="14" transform="rotate(30)"/></g>' +
      '</g>' +
      '<g fill="#fbbf24">' +
      '<circle cx="10" cy="50" r="3"/>' +
      '<circle cx="30" cy="50" r="3"/>' +
      '<circle cx="50" cy="50" r="3"/>' +
      '<circle cx="70" cy="50" r="3"/>' +
      '<circle cx="90" cy="50" r="3"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mandala border — arch repeat',
    category: 'mandala-border',
    svg: wrap(
      '<line x1="0" y1="80" x2="100" y2="80" stroke="#7c2d12" stroke-width="1.5"/>' +
      '<g fill="none" stroke="#dc2626" stroke-width="1.5">' +
      // Continuous archways
      '<path d="M0 80 Q 10 30 20 80"/>' +
      '<path d="M20 80 Q 30 30 40 80"/>' +
      '<path d="M40 80 Q 50 30 60 80"/>' +
      '<path d="M60 80 Q 70 30 80 80"/>' +
      '<path d="M80 80 Q 90 30 100 80"/>' +
      '</g>' +
      '<g fill="#dc2626">' +
      '<circle cx="10" cy="32" r="3"/>' +
      '<circle cx="30" cy="32" r="3"/>' +
      '<circle cx="50" cy="32" r="3"/>' +
      '<circle cx="70" cy="32" r="3"/>' +
      '<circle cx="90" cy="32" r="3"/>' +
      '</g>' +
      '<g fill="#fbbf24">' +
      '<circle cx="10" cy="32" r="1.2"/>' +
      '<circle cx="30" cy="32" r="1.2"/>' +
      '<circle cx="50" cy="32" r="1.2"/>' +
      '<circle cx="70" cy="32" r="1.2"/>' +
      '<circle cx="90" cy="32" r="1.2"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mandala border — dot lattice',
    category: 'mandala-border',
    svg: wrap(
      '<line x1="0" y1="25" x2="100" y2="25" stroke="#9333ea" stroke-width="0.8"/>' +
      '<line x1="0" y1="75" x2="100" y2="75" stroke="#9333ea" stroke-width="0.8"/>' +
      '<g fill="#9333ea">' +
      // Top dot row
      '<circle cx="5" cy="25" r="1.5"/><circle cx="15" cy="25" r="1.5"/><circle cx="25" cy="25" r="1.5"/>' +
      '<circle cx="35" cy="25" r="1.5"/><circle cx="45" cy="25" r="1.5"/><circle cx="55" cy="25" r="1.5"/>' +
      '<circle cx="65" cy="25" r="1.5"/><circle cx="75" cy="25" r="1.5"/><circle cx="85" cy="25" r="1.5"/>' +
      '<circle cx="95" cy="25" r="1.5"/>' +
      // Bottom dot row
      '<circle cx="5" cy="75" r="1.5"/><circle cx="15" cy="75" r="1.5"/><circle cx="25" cy="75" r="1.5"/>' +
      '<circle cx="35" cy="75" r="1.5"/><circle cx="45" cy="75" r="1.5"/><circle cx="55" cy="75" r="1.5"/>' +
      '<circle cx="65" cy="75" r="1.5"/><circle cx="75" cy="75" r="1.5"/><circle cx="85" cy="75" r="1.5"/>' +
      '<circle cx="95" cy="75" r="1.5"/>' +
      '</g>' +
      // 5 mandala-style flowers in the middle band
      '<g fill="#a855f7">' +
      '<g transform="translate(10 50)"><circle r="6"/><circle r="6" cy="-6" fill="#fbbf24"/></g>' +
      '<g transform="translate(30 50)"><circle r="6"/><circle r="6" cy="-6" fill="#fbbf24"/></g>' +
      '<g transform="translate(50 50)"><circle r="6"/><circle r="6" cy="-6" fill="#fbbf24"/></g>' +
      '<g transform="translate(70 50)"><circle r="6"/><circle r="6" cy="-6" fill="#fbbf24"/></g>' +
      '<g transform="translate(90 50)"><circle r="6"/><circle r="6" cy="-6" fill="#fbbf24"/></g>' +
      '</g>' +
      '<g fill="#dc2626">' +
      '<circle cx="10" cy="50" r="2"/>' +
      '<circle cx="30" cy="50" r="2"/>' +
      '<circle cx="50" cy="50" r="2"/>' +
      '<circle cx="70" cy="50" r="2"/>' +
      '<circle cx="90" cy="50" r="2"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mandala border — wave + dots',
    category: 'mandala-border',
    svg: wrap(
      '<path d="M0 50 Q 6.25 30 12.5 50 Q 18.75 70 25 50 Q 31.25 30 37.5 50 Q 43.75 70 50 50 ' +
      'Q 56.25 30 62.5 50 Q 68.75 70 75 50 Q 81.25 30 87.5 50 Q 93.75 70 100 50" ' +
      'fill="none" stroke="#9a3412" stroke-width="1.5"/>' +
      '<path d="M0 50 Q 6.25 70 12.5 50 Q 18.75 30 25 50 Q 31.25 70 37.5 50 Q 43.75 30 50 50 ' +
      'Q 56.25 70 62.5 50 Q 68.75 30 75 50 Q 81.25 70 87.5 50 Q 93.75 30 100 50" ' +
      'fill="none" stroke="#dc2626" stroke-width="1.5"/>' +
      '<g fill="#fbbf24">' +
      '<circle cx="6.25" cy="30" r="1.8"/>' +
      '<circle cx="18.75" cy="70" r="1.8"/>' +
      '<circle cx="31.25" cy="30" r="1.8"/>' +
      '<circle cx="43.75" cy="70" r="1.8"/>' +
      '<circle cx="56.25" cy="30" r="1.8"/>' +
      '<circle cx="68.75" cy="70" r="1.8"/>' +
      '<circle cx="81.25" cy="30" r="1.8"/>' +
      '<circle cx="93.75" cy="70" r="1.8"/>' +
      '</g>',
    ),
  },

  // ===========================
  // MURAL — figurative folk art (PX-128)
  // ===========================
  {
    name: 'Mural — sun + lotus',
    category: 'mural',
    svg: wrap(
      // Sun
      '<g fill="#dc2626">' +
      '<circle cx="50" cy="30" r="14"/>' +
      '<polygon points="50,5 53,18 47,18"/>' +
      '<polygon points="78,15 75,28 70,25"/>' +
      '<polygon points="22,15 25,28 30,25"/>' +
      '<polygon points="85,40 75,42 78,36"/>' +
      '<polygon points="15,40 25,42 22,36"/>' +
      '</g>' +
      // Lotus base
      '<g fill="#9333ea">' +
      '<ellipse cx="50" cy="70" rx="6" ry="20" transform="rotate(-45 50 70)"/>' +
      '<ellipse cx="50" cy="70" rx="6" ry="20"/>' +
      '<ellipse cx="50" cy="70" rx="6" ry="20" transform="rotate(45 50 70)"/>' +
      '</g>' +
      '<rect x="0" y="92" width="100" height="4" fill="#15803d"/>' +
      '<rect x="0" y="96" width="100" height="4" fill="#84cc16"/>',
    ),
  },
  {
    name: 'Mural — peacock motif',
    category: 'mural',
    svg: wrap(
      // Body
      '<ellipse cx="50" cy="60" rx="14" ry="20" fill="#0891b2"/>' +
      // Tail feathers
      '<g fill="#0e7490" stroke="#155e75" stroke-width="1">' +
      '<path d="M50 60 Q 20 40 8 30"/>' +
      '<path d="M50 60 Q 30 30 25 12"/>' +
      '<path d="M50 60 Q 50 25 50 8"/>' +
      '<path d="M50 60 Q 70 30 75 12"/>' +
      '<path d="M50 60 Q 80 40 92 30"/>' +
      '</g>' +
      '<g fill="#fbbf24">' +
      '<circle cx="8" cy="30" r="4"/>' +
      '<circle cx="25" cy="12" r="4"/>' +
      '<circle cx="50" cy="8" r="4"/>' +
      '<circle cx="75" cy="12" r="4"/>' +
      '<circle cx="92" cy="30" r="4"/>' +
      '</g>' +
      // Beak + eye
      '<polygon points="50,46 47,40 53,40" fill="#dc2626"/>' +
      '<circle cx="50" cy="50" r="2" fill="#fff"/>' +
      '<circle cx="50" cy="50" r="1" fill="#000"/>',
    ),
  },
  {
    name: 'Mural — fish',
    category: 'mural',
    svg: wrap(
      // Body
      '<ellipse cx="42" cy="50" rx="32" ry="18" fill="#dc2626"/>' +
      // Tail
      '<polygon points="74,50 95,30 88,50 95,70" fill="#7f1d1d"/>' +
      // Fins
      '<path d="M42 32 Q 50 18 58 32 Z" fill="#7f1d1d"/>' +
      '<path d="M42 68 Q 50 82 58 68 Z" fill="#7f1d1d"/>' +
      // Eye
      '<circle cx="28" cy="46" r="5" fill="#fef3c7"/>' +
      '<circle cx="28" cy="46" r="2" fill="#000"/>' +
      // Scales
      '<g fill="none" stroke="#fbbf24" stroke-width="1">' +
      '<path d="M42 38 Q 48 50 42 62 M 50 36 Q 56 50 50 64 M 58 38 Q 64 50 58 62 M 66 40 Q 70 50 66 60"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mural — temple',
    category: 'mural',
    svg: wrap(
      // Roof tiers
      '<polygon points="50,5 80,20 20,20" fill="#9a3412"/>' +
      '<polygon points="50,18 78,30 22,30" fill="#7c2d12"/>' +
      '<polygon points="50,28 76,40 24,40" fill="#9a3412"/>' +
      // Body
      '<rect x="22" y="40" width="56" height="50" fill="#fef3c7"/>' +
      // Doorway
      '<path d="M40 90 L 40 60 Q 50 50 60 60 L 60 90 Z" fill="#7c2d12"/>' +
      // Pillars
      '<rect x="22" y="40" width="6" height="50" fill="#9a3412"/>' +
      '<rect x="72" y="40" width="6" height="50" fill="#9a3412"/>' +
      // Finial
      '<circle cx="50" cy="3" r="3" fill="#fbbf24"/>' +
      // Base
      '<rect x="18" y="90" width="64" height="4" fill="#7c2d12"/>',
    ),
  },

  // ===========================
  // MURAL BORDERS (PX-128)
  // ===========================
  {
    name: 'Mural border — diya row',
    category: 'mural-border',
    svg: wrap(
      '<line x1="0" y1="65" x2="100" y2="65" stroke="#7c2d12" stroke-width="1.5"/>' +
      // Diyas
      '<g>' +
      '<path d="M5 65 Q 15 78 25 65 Q 22 70 15 71 Q 8 70 5 65" fill="#b45309"/>' +
      '<path d="M30 65 Q 40 78 50 65 Q 47 70 40 71 Q 33 70 30 65" fill="#b45309"/>' +
      '<path d="M55 65 Q 65 78 75 65 Q 72 70 65 71 Q 58 70 55 65" fill="#b45309"/>' +
      '<path d="M80 65 Q 90 78 100 65 Q 97 70 90 71 Q 83 70 80 65" fill="#b45309"/>' +
      '</g>' +
      '<g fill="#fbbf24">' +
      '<path d="M14 50 Q 13 60 15 65 Q 17 60 16 50 Q 15 45 14 50 Z"/>' +
      '<path d="M39 50 Q 38 60 40 65 Q 42 60 41 50 Q 40 45 39 50 Z"/>' +
      '<path d="M64 50 Q 63 60 65 65 Q 67 60 66 50 Q 65 45 64 50 Z"/>' +
      '<path d="M89 50 Q 88 60 90 65 Q 92 60 91 50 Q 90 45 89 50 Z"/>' +
      '</g>',
    ),
  },
  {
    name: 'Mural border — paisley chain',
    category: 'mural-border',
    svg: wrap(
      '<line x1="0" y1="50" x2="100" y2="50" stroke="#9333ea" stroke-width="1"/>' +
      '<g fill="#9333ea">' +
      '<path d="M5 60 C 0 50 5 35 18 35 C 28 35 28 50 18 50 C 14 48 18 45 18 50 C 18 52 12 55 5 60"/>' +
      '<path d="M30 60 C 25 50 30 35 43 35 C 53 35 53 50 43 50 C 39 48 43 45 43 50 C 43 52 37 55 30 60"/>' +
      '<path d="M55 60 C 50 50 55 35 68 35 C 78 35 78 50 68 50 C 64 48 68 45 68 50 C 68 52 62 55 55 60"/>' +
      '<path d="M80 60 C 75 50 80 35 93 35 C 95 35 95 50 93 50 C 89 48 93 45 93 50 C 93 52 87 55 80 60"/>' +
      '</g>',
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
  { id: 'mandala', label: 'Mandala art' },
  { id: 'mandala-border', label: 'Mandala borders' },
  { id: 'mural', label: 'Mural art' },
  { id: 'mural-border', label: 'Mural borders' },
  { id: 'indian-motifs', label: 'Indian motifs' },
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
