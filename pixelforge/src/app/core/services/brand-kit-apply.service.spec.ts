import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { BrandKitApplyService } from './brand-kit-apply.service';
import { BrandKitService } from './brand-kit.service';
import { CanvasService } from './canvas.service';
import { HistoryService } from './history.service';
import { TemplateService } from './template.service';
import { ApiService } from './api.service';

/**
 * Vitest suite for {@link BrandKitApplyService}.
 *
 * Covers the revert path for PX-060 T-3:
 *   * Fetches the source template and substitutes palette-slot defaults.
 *   * Walks nested groups (fabric `objects` children).
 *   * Calls `HistoryService.saveState` for Undo → Redo symmetry.
 *   * Posts `brand_kit_applied_at: null` to clear the server marker.
 *   * Handles missing templates and empty Brand Kits gracefully.
 */
describe('BrandKitApplyService', () => {
  let service: BrandKitApplyService;
  let canvasStub: any;
  let historyStub: any;
  let templateStub: any;
  let apiStub: any;
  let brandKitStub: any;

  // Helper: create a fabric-like object stub with set() spying.
  function makeObj(initial: { fill?: string; stroke?: string; objects?: any[] }) {
    const o: any = { ...initial };
    o.set = vi.fn((k: string, v: unknown) => {
      o[k] = v;
    });
    return o;
  }

  beforeEach(() => {
    const objects: any[] = [];
    canvasStub = {
      getCanvas: vi.fn(() => ({
        getObjects: vi.fn(() => objects),
        requestRenderAll: vi.fn(),
      })),
      __objects: objects,
    };
    historyStub = { saveState: vi.fn() };
    templateStub = { getById: vi.fn() };
    apiStub = { updateProject: vi.fn(() => of({})) };
    brandKitStub = {
      brandColors: signal<string[]>(['#AA0000', '#00BB00', '#0000CC']),
    };

    TestBed.configureTestingModule({
      providers: [
        BrandKitApplyService,
        { provide: CanvasService, useValue: canvasStub },
        { provide: HistoryService, useValue: historyStub },
        { provide: TemplateService, useValue: templateStub },
        { provide: ApiService, useValue: apiStub },
        { provide: BrandKitService, useValue: brandKitStub },
      ],
    });
    service = TestBed.inject(BrandKitApplyService);
  });

  it('is a no-op when the template can no longer be fetched', async () => {
    templateStub.getById.mockResolvedValue(null);
    await service.revertToTemplateDefaults('p1', 'missing-tpl', 'ig-post');
    expect(historyStub.saveState).not.toHaveBeenCalled();
    expect(apiStub.updateProject).not.toHaveBeenCalled();
  });

  it('reverts fill/stroke on top-level objects then clears the marker server-side', async () => {
    const shape = makeObj({ fill: '#aa0000', stroke: '#00bb00' });
    const untouched = makeObj({ fill: '#999999' });
    canvasStub.__objects.push(shape, untouched);

    templateStub.getById.mockResolvedValue({
      _id: 'tpl-1',
      palette_slots: [
        { role: 'primary', default: '#111111' },
        { role: 'secondary', default: '#222222' },
        { role: 'text', default: '#333333' },
      ],
    });

    await service.revertToTemplateDefaults('p1', 'tpl-1', 'ig-post');

    expect(shape.set).toHaveBeenCalledWith('fill', '#111111');
    expect(shape.set).toHaveBeenCalledWith('stroke', '#222222');
    expect(untouched.set).not.toHaveBeenCalled();

    expect(historyStub.saveState).toHaveBeenCalledTimes(1);
    expect(apiStub.updateProject).toHaveBeenCalledWith('p1', {
      brand_kit_applied_at: null,
    });
  });

  it('recurses into grouped children (nested fabric objects)', async () => {
    const child = makeObj({ fill: '#aa0000' });
    const group = makeObj({ objects: [child] });
    canvasStub.__objects.push(group);

    templateStub.getById.mockResolvedValue({
      _id: 'tpl-1',
      palette_slots: [{ role: 'primary', default: '#ffffff' }],
    });

    await service.revertToTemplateDefaults('p1', 'tpl-1', 'ig-post');
    expect(child.set).toHaveBeenCalledWith('fill', '#ffffff');
  });

  it('when Brand Kit is empty, still clears the server marker without touching canvas', async () => {
    brandKitStub.brandColors.set([]);
    const shape = makeObj({ fill: '#aa0000' });
    canvasStub.__objects.push(shape);

    templateStub.getById.mockResolvedValue({
      _id: 'tpl-1',
      palette_slots: [{ role: 'primary', default: '#111111' }],
    });

    await service.revertToTemplateDefaults('p1', 'tpl-1', 'ig-post');
    expect(shape.set).not.toHaveBeenCalled();
    expect(historyStub.saveState).not.toHaveBeenCalled();
    expect(apiStub.updateProject).toHaveBeenCalledWith('p1', {
      brand_kit_applied_at: null,
    });
  });

  it('clearMarker() delegates to ApiService.updateProject with brand_kit_applied_at: null', async () => {
    await service.clearMarker('p1');
    expect(apiStub.updateProject).toHaveBeenCalledWith('p1', {
      brand_kit_applied_at: null,
    });
  });
});
