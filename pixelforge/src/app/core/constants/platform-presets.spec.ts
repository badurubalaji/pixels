import { describe, it, expect } from 'vitest';
import {
  PLATFORM_PRESETS,
  getPlatformPreset,
  PlatformType,
} from './platform-presets';

/**
 * Story PX-020 AC-2 + AC-6 coverage: every preset's dimensions and aspect
 * ratio are pinned. Any accidental edit to the canonical constants file is
 * caught here; the backend parity pytest catches FE/BE drift.
 */
describe('platform-presets', () => {
  const expected: ReadonlyArray<{
    id: PlatformType;
    label: string;
    width: number;
    height: number;
    aspect: string;
  }> = [
    { id: 'ig-post', label: 'Instagram Post', width: 1080, height: 1080, aspect: '1:1' },
    { id: 'ig-story', label: 'Instagram Story', width: 1080, height: 1920, aspect: '9:16' },
    { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627, aspect: '1.91:1' },
    { id: 'linkedin-banner', label: 'LinkedIn Banner', width: 1584, height: 396, aspect: '4:1' },
    { id: 'yt-thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, aspect: '16:9' },
    { id: 'custom', label: 'Custom', width: 0, height: 0, aspect: 'custom' },
  ];

  it('exposes exactly the 6 MVP presets in the declared order', () => {
    expect(PLATFORM_PRESETS.length).toBe(expected.length);
    PLATFORM_PRESETS.forEach((preset, i) => {
      expect(preset.id).toBe(expected[i].id);
    });
  });

  for (const ex of expected) {
    it(`preset "${ex.id}" has the expected dimensions/label/aspect`, () => {
      const preset = PLATFORM_PRESETS.find((p) => p.id === ex.id);
      expect(preset).toBeDefined();
      expect(preset!.label).toBe(ex.label);
      expect(preset!.width).toBe(ex.width);
      expect(preset!.height).toBe(ex.height);
      expect(preset!.aspect).toBe(ex.aspect);
    });
  }

  it('custom preset is the 0x0 sentinel', () => {
    const custom = PLATFORM_PRESETS.find((p) => p.id === 'custom');
    expect(custom).toBeDefined();
    expect(custom!.width).toBe(0);
    expect(custom!.height).toBe(0);
  });

  describe('getPlatformPreset', () => {
    it('returns the preset for a known id', () => {
      expect(getPlatformPreset('ig-post')?.width).toBe(1080);
      expect(getPlatformPreset('yt-thumb')?.height).toBe(720);
    });

    it('returns undefined for unknown id', () => {
      expect(getPlatformPreset('bogus')).toBeUndefined();
    });

    it('returns undefined for null/undefined input', () => {
      expect(getPlatformPreset(null)).toBeUndefined();
      expect(getPlatformPreset(undefined)).toBeUndefined();
      expect(getPlatformPreset('')).toBeUndefined();
    });
  });
});
