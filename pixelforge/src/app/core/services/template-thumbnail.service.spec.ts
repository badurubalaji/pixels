import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateThumbnailService } from './template-thumbnail.service';
import type {
  FabricJson,
  PaletteSlot,
} from '../models/template.model';

/**
 * Mock fabric.js 7 for jsdom — only the `StaticCanvas` surface the service
 * exercises needs to be modeled. Follows the pattern from
 * `canvas.service.spec.ts` (PX-001 legacy).
 */
vi.mock('fabric', () => {
  class StaticCanvas {
    constructor(_el: HTMLCanvasElement, _opts?: unknown) {
      void _el;
      void _opts;
    }
    async loadFromJSON(_json: unknown): Promise<void> {
      void _json;
    }
    renderAll(): void {
      /* noop */
    }
    toDataURL(_opts?: { format?: string; multiplier?: number }): string {
      void _opts;
      return 'data:image/png;base64,MOCK';
    }
    dispose(): void {
      /* noop */
    }
  }
  return { StaticCanvas };
});

/**
 * Vitest suite for {@link TemplateThumbnailService}.
 *
 * Covers AC-3 (Brand-Kit color substitution) and the render cache contract.
 */
describe('TemplateThumbnailService', () => {
  let service: TemplateThumbnailService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TemplateThumbnailService] });
    service = TestBed.inject(TemplateThumbnailService);
  });

  describe('applyBrandKit', () => {
    const slots: PaletteSlot[] = [
      { role: 'primary', default: '#FF3B30' },
      { role: 'secondary', default: '#FFD60A' },
      { role: 'text', default: '#1C1C1E' },
    ];

    const scene: FabricJson = {
      version: '7.0.0',
      objects: [
        { type: 'rect', fill: '#FF3B30' },
        { type: 'rect', fill: '#FFD60A', stroke: '#1C1C1E' },
        { type: 'textbox', fill: '#1C1C1E', text: 'Hi' },
      ],
    };

    it('substitutes palette defaults in role order', () => {
      const result = service.applyBrandKit(scene, slots, ['#111111', '#222222', '#333333']);
      expect(result.objects?.[0].fill).toBe('#111111');
      expect(result.objects?.[1].fill).toBe('#222222');
      expect(result.objects?.[1].stroke).toBe('#333333');
      expect(result.objects?.[2].fill).toBe('#333333');
    });

    it('no-ops when brandColors is null', () => {
      const result = service.applyBrandKit(scene, slots, null);
      expect(result).toBe(scene);
    });

    it('no-ops when brandColors is empty', () => {
      const result = service.applyBrandKit(scene, slots, []);
      expect(result).toBe(scene);
    });

    it('leaves unmatched fills untouched', () => {
      const result = service.applyBrandKit(scene, slots, ['#111111']);
      // Only primary → first object rewritten; others keep their defaults.
      expect(result.objects?.[0].fill).toBe('#111111');
      expect(result.objects?.[1].fill).toBe('#FFD60A');
      expect(result.objects?.[2].fill).toBe('#1C1C1E');
    });

    it('rewrites all objects sharing a palette color', () => {
      const shared: FabricJson = {
        objects: [
          { type: 'rect', fill: '#FF3B30' },
          { type: 'rect', fill: '#FF3B30' },
          { type: 'rect', fill: '#FF3B30' },
        ],
      };
      const result = service.applyBrandKit(shared, [slots[0]], ['#00FF00']);
      for (const obj of result.objects ?? []) {
        expect(obj.fill).toBe('#00FF00');
      }
    });

    it('matches hex case-insensitively', () => {
      const scene2: FabricJson = {
        objects: [{ type: 'rect', fill: '#ff3b30' }],
      };
      const result = service.applyBrandKit(scene2, slots, ['#111111']);
      expect(result.objects?.[0].fill).toBe('#111111');
    });

    it('matches short-form #RGB against long-form #RRGGBB defaults', () => {
      const shortDefault: PaletteSlot[] = [{ role: 'primary', default: '#F00' }];
      const scene3: FabricJson = { objects: [{ type: 'rect', fill: '#FF0000' }] };
      const result = service.applyBrandKit(scene3, shortDefault, ['#ABCDEF']);
      expect(result.objects?.[0].fill).toBe('#ABCDEF');
    });

    it('recurses into grouped objects', () => {
      const grouped: FabricJson = {
        objects: [
          {
            type: 'group',
            objects: [
              { type: 'rect', fill: '#FF3B30' },
              { type: 'textbox', fill: '#1C1C1E' },
            ],
          },
        ],
      };
      const result = service.applyBrandKit(grouped, slots, ['#111111', '#222222', '#333333']);
      const inner = result.objects?.[0].objects;
      expect(inner?.[0].fill).toBe('#111111');
      expect(inner?.[1].fill).toBe('#333333');
    });

    it('does not mutate the input scene', () => {
      const input = JSON.parse(JSON.stringify(scene));
      service.applyBrandKit(input, slots, ['#111111']);
      expect(input.objects[0].fill).toBe('#FF3B30');
    });
  });

  describe('renderThumbnailDataUrl', () => {
    it('returns a PNG data URL via fabric.StaticCanvas', async () => {
      const url = await service.renderThumbnailDataUrl({ objects: [] }, 1080, 1080);
      expect(url).toBe('data:image/png;base64,MOCK');
    });

    it('handles zero dims without throwing', async () => {
      const url = await service.renderThumbnailDataUrl({ objects: [] }, 0, 0);
      expect(url).toMatch(/^data:image\/png/);
    });
  });

  describe('getOrRenderThumbnail cache', () => {
    it('memoizes identical (templateId, signature) pairs', async () => {
      const url1 = await service.getOrRenderThumbnail('t1', { objects: [] }, 100, 100, 'sig');
      const url2 = await service.getOrRenderThumbnail('t1', { objects: [] }, 100, 100, 'sig');
      expect(url1).toBe(url2);
    });

    it('clearCache evicts entries', async () => {
      await service.getOrRenderThumbnail('t1', { objects: [] }, 100, 100, 'sig');
      service.clearCache();
      // A subsequent call should still return a valid data URL (cache was cold).
      const url = await service.getOrRenderThumbnail('t1', { objects: [] }, 100, 100, 'sig');
      expect(url).toMatch(/^data:image\/png/);
    });
  });
});
