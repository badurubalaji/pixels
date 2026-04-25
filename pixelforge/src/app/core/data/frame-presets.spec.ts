import { describe, it, expect } from 'vitest';

import { FRAME_PRESETS, getFramePreset } from './frame-presets';

describe('FRAME_PRESETS — PX-090', () => {
  it('ships the 8 MVP collage presets + 5 single-shape presets (PX-102)', () => {
    expect(FRAME_PRESETS).toHaveLength(13);
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
});
