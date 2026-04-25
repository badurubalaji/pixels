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
  // PX-120: catalog expanded from 6 → 19 (Canva parity).
  const expected: ReadonlyArray<{
    id: PlatformType;
    label: string;
    width: number;
    height: number;
    aspect: string;
  }> = [
    { id: 'ig-post', label: 'Instagram Post', width: 1080, height: 1080, aspect: '1:1' },
    { id: 'ig-story', label: 'Instagram Story', width: 1080, height: 1920, aspect: '9:16' },
    { id: 'ig-reel', label: 'Instagram Reel', width: 1080, height: 1920, aspect: '9:16' },
    { id: 'fb-post', label: 'Facebook Post', width: 1200, height: 630, aspect: '1.91:1' },
    { id: 'fb-cover', label: 'Facebook Cover', width: 820, height: 312, aspect: '2.63:1' },
    { id: 'tw-post', label: 'Twitter Post', width: 1200, height: 675, aspect: '16:9' },
    { id: 'tw-header', label: 'Twitter Header', width: 1500, height: 500, aspect: '3:1' },
    { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627, aspect: '1.91:1' },
    { id: 'linkedin-banner', label: 'LinkedIn Banner', width: 1584, height: 396, aspect: '4:1' },
    { id: 'yt-thumb', label: 'YouTube Thumbnail', width: 1280, height: 720, aspect: '16:9' },
    { id: 'yt-channel-art', label: 'YouTube Channel Art', width: 2560, height: 1440, aspect: '16:9' },
    { id: 'tiktok-video', label: 'TikTok Video', width: 1080, height: 1920, aspect: '9:16' },
    { id: 'pinterest-pin', label: 'Pinterest Pin', width: 1000, height: 1500, aspect: '2:3' },
    { id: 'presentation-16-9', label: 'Presentation (16:9)', width: 1920, height: 1080, aspect: '16:9' },
    { id: 'doc-a4', label: 'A4 Document', width: 2480, height: 3508, aspect: '1:1.41' },
    { id: 'doc-letter', label: 'US Letter', width: 2550, height: 3300, aspect: '1:1.29' },
    { id: 'business-card', label: 'Business Card', width: 1050, height: 600, aspect: '1.75:1' },
    { id: 'logo', label: 'Logo', width: 500, height: 500, aspect: '1:1' },
    { id: 'custom', label: 'Custom', width: 0, height: 0, aspect: 'custom' },
  ];

  it('exposes the canonical preset list in the declared order', () => {
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
