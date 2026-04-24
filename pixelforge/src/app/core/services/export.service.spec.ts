import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// fabric is pulled in transitively by export.service → canvas.service. The
// export spec only exercises the pure preset-lookup code path, so we stub
// fabric to the minimum shape the import chain needs.
vi.mock('fabric', () => {
  class FabricObject {}
  class Canvas {
    on() {}
    off() {}
    renderAll() {}
    requestRenderAll() {}
    setDimensions() {}
    setViewportTransform() {}
    setZoom() {}
    getZoom() { return 1; }
    viewportTransform: number[] = [1, 0, 0, 1, 0, 0];
    upperCanvasEl = document.createElement('canvas');
    dispose() {}
    getObjects() { return []; }
  }
  return {
    Canvas,
    FabricObject,
    Rect: class extends FabricObject {},
    Circle: class extends FabricObject {},
    Line: class extends FabricObject {},
    Triangle: class extends FabricObject {},
    Polygon: class extends FabricObject {},
    FabricText: class extends FabricObject {},
    IText: class extends FabricObject {},
    FabricImage: class extends FabricObject {},
    Group: class extends FabricObject { getObjects() { return []; } },
    ActiveSelection: class extends FabricObject {},
    Path: class extends FabricObject {},
    Pattern: class {},
    PencilBrush: class { constructor(_c: any) {} },
    Point: class { constructor(public x: number, public y: number) {} },
    util: { groupSVGElements: (o: any[]) => o },
    loadSVGFromString: vi.fn(),
  };
});

import { ExportService } from './export.service';
import { CanvasService } from './canvas.service';
import { AnimationService } from './animation.service';
import { PLATFORM_PRESETS } from '../constants/platform-presets';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: CanvasService, useValue: { getCanvas: () => null, canvasWidth: () => 1000, canvasHeight: () => 1000 } },
        { provide: AnimationService, useValue: { playAll: vi.fn(async () => {}) } },
      ],
    });
    service = TestBed.inject(ExportService);
  });

  describe('applyPlatformPreset (PX-020 AC-3, AC-6)', () => {
    const cases = [
      { id: 'ig-post', width: 1080, height: 1080, label: 'Instagram Post', aspect: '1:1' },
      { id: 'ig-story', width: 1080, height: 1920, label: 'Instagram Story', aspect: '9:16' },
      { id: 'linkedin-post', width: 1200, height: 627, label: 'LinkedIn Post', aspect: '1.91:1' },
      { id: 'linkedin-banner', width: 1584, height: 396, label: 'LinkedIn Banner', aspect: '4:1' },
      { id: 'yt-thumb', width: 1280, height: 720, label: 'YouTube Thumbnail', aspect: '16:9' },
    ] as const;

    for (const c of cases) {
      it(`returns ${c.width}x${c.height} for "${c.id}"`, () => {
        const p = service.applyPlatformPreset(c.id);
        expect(p).toBeDefined();
        expect(p!.width).toBe(c.width);
        expect(p!.height).toBe(c.height);
        expect(p!.label).toBe(c.label);
        expect(p!.aspect).toBe(c.aspect);
      });
    }

    it('returns the 0x0 custom sentinel for "custom"', () => {
      const p = service.applyPlatformPreset('custom');
      expect(p).toBeDefined();
      expect(p!.width).toBe(0);
      expect(p!.height).toBe(0);
    });

    it('returns undefined for unknown platform ids', () => {
      // Cast through unknown because PlatformType is a strict union — the
      // runtime still needs to defend against stale query-params.
      const p = (service.applyPlatformPreset as any)('not-a-platform');
      expect(p).toBeUndefined();
    });

    it('exposes the canonical PLATFORM_PRESETS list', () => {
      expect(service.platformPresets).toBe(PLATFORM_PRESETS);
      expect(service.platformPresets.length).toBe(PLATFORM_PRESETS.length);
    });
  });
});
