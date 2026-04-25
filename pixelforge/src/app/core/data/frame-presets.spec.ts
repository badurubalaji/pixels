import { describe, it, expect } from 'vitest';

import {
  FRAME_PRESETS,
  FRAME_CATEGORY_LABELS,
  getFramePreset,
  getFramePresetsByCategory,
} from './frame-presets';

describe('FRAME_PRESETS — PX-090 / PX-121', () => {
  it('ships the curated MVP catalogue (31 presets across 7 categories)', () => {
    // PX-090: 8 collage + PX-102: 5 shapes + PX-121: 12 new + PX-124: 6 new = 31.
    expect(FRAME_PRESETS).toHaveLength(31);
  });

  it('includes single-shape presets for circle / rounded / hexagon / star / heart', () => {
    const ids = FRAME_PRESETS.map(p => p.id);
    expect(ids).toContain('single-circle');
    expect(ids).toContain('single-rounded');
    expect(ids).toContain('single-hexagon');
    expect(ids).toContain('single-star');
    expect(ids).toContain('single-heart');
  });

  it('every single-shape preset has its slot shape set', () => {
    const singles = FRAME_PRESETS.filter(p => p.id.startsWith('single-'));
    for (const p of singles) {
      expect(p.slots.length).toBe(1);
      expect(p.slots[0].shape).toBeDefined();
      expect(p.slots[0].shape).not.toBe('rect');
    }
  });

  it('every preset has a non-empty slots array', () => {
    for (const p of FRAME_PRESETS) {
      expect(p.slots.length).toBeGreaterThan(0);
    }
  });

  it('every slot is normalized to [0, 1]', () => {
    for (const p of FRAME_PRESETS) {
      for (const s of p.slots) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(1);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(1);
        expect(s.w).toBeGreaterThan(0);
        expect(s.h).toBeGreaterThan(0);
        expect(s.x + s.w).toBeLessThanOrEqual(1.001); // tiny rounding tolerance
        expect(s.y + s.h).toBeLessThanOrEqual(1.001);
      }
    }
  });

  it('preset ids are unique', () => {
    const ids = new Set(FRAME_PRESETS.map(p => p.id));
    expect(ids.size).toBe(FRAME_PRESETS.length);
  });

  it('split-2-h has exactly 2 horizontal slots', () => {
    const p = getFramePreset('split-2-h');
    expect(p?.slots).toHaveLength(2);
    expect(p?.slots[0].h).toBeCloseTo(1, 2);
  });

  it('grid-2x2 has 4 equally-sized slots', () => {
    const p = getFramePreset('grid-2x2');
    expect(p?.slots).toHaveLength(4);
    const widths = p!.slots.map(s => s.w);
    expect(new Set(widths.map(w => w.toFixed(3))).size).toBe(1);
  });

  it('polaroid-scatter rotates each slot', () => {
    const p = getFramePreset('polaroid-scatter');
    expect(p?.slots.every(s => s.rotation !== undefined && s.rotation !== 0)).toBe(true);
  });

  it('getFramePreset returns undefined for unknown id', () => {
    expect(getFramePreset('not-a-real-preset')).toBeUndefined();
  });

  // PX-121 — sub-categories
  it('every preset declares a category from the canonical list', () => {
    const validIds = new Set(FRAME_CATEGORY_LABELS.map(c => c.id));
    for (const p of FRAME_PRESETS) {
      expect(validIds.has(p.category)).toBe(true);
    }
  });

  it('getFramePresetsByCategory returns all 7 categories non-empty', () => {
    const grouped = getFramePresetsByCategory();
    expect(grouped).toHaveLength(7);
    for (const section of grouped) {
      expect(section.presets.length).toBeGreaterThan(0);
    }
  });

  it('devices category contains phone + landscape + pair variants (PX-124)', () => {
    const grouped = getFramePresetsByCategory();
    const ids = grouped.find(g => g.id === 'devices')!.presets.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining(['device-phone', 'device-phone-landscape', 'device-pair']));
  });

  it('paper category contains polaroid + torn variants (PX-124)', () => {
    const grouped = getFramePresetsByCategory();
    const ids = grouped.find(g => g.id === 'paper')!.presets.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining(['paper-polaroid-single', 'paper-torn-single', 'paper-torn-row']));
  });

  it('grids category contains the multi-slot rectangular layouts', () => {
    const grouped = getFramePresetsByCategory();
    const grids = grouped.find(g => g.id === 'grids');
    const ids = grids!.presets.map(p => p.id);
    expect(ids).toContain('split-2-h');
    expect(ids).toContain('grid-2x2');
    expect(ids).toContain('grid-3x3');
    expect(ids).toContain('magazine-1-plus-3');
    expect(ids).toContain('quad-l');
  });

  it('strips category contains the filmstrip variants (horizontal + vertical)', () => {
    const grouped = getFramePresetsByCategory();
    const strips = grouped.find(g => g.id === 'strips');
    const ids = strips!.presets.map(p => p.id);
    expect(ids).toContain('strip-2-h');
    expect(ids).toContain('strip-3-h');
    expect(ids).toContain('strip-4-h');
    expect(ids).toContain('strip-3-v');
    expect(ids).toContain('strip-4-v');
  });

  it('polaroid category contains scattered + row + stack variants', () => {
    const grouped = getFramePresetsByCategory();
    const ids = grouped.find(g => g.id === 'polaroid')!.presets.map(p => p.id);
    expect(ids).toEqual(expect.arrayContaining(['polaroid-scatter', 'polaroid-row', 'polaroid-stack']));
  });
});
