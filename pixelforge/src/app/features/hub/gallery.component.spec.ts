import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GalleryComponent } from './gallery.component';
import { ApiService } from '../../core/services/api.service';
import { BrandKitService } from '../../core/services/brand-kit.service';
import { TemplateThumbnailService } from '../../core/services/template-thumbnail.service';
import { signal } from '@angular/core';
import type { Template } from '../../core/models/template.model';

/**
 * Mock fabric — GalleryComponent pulls in TemplateThumbnailService which
 * dynamically imports fabric during render. We stub StaticCanvas up front so
 * the test isolates Gallery behavior from the renderer.
 */
vi.mock('fabric', () => {
  class StaticCanvas {
    constructor(..._args: unknown[]) {}
    async loadFromJSON(): Promise<void> {}
    renderAll(): void {}
    toDataURL(): string {
      return 'data:image/png;base64,MOCK';
    }
    dispose(): void {}
  }
  return { StaticCanvas };
});

/**
 * Vitest suite for {@link GalleryComponent}.
 *
 * Covers AC-1 (routing), AC-2 (fetch), AC-4 (click → create + navigate),
 * AC-5 (chip filter re-fetch), AC-6 (empty state), AC-7 (start-from-scratch),
 * AC-9 (loading state).
 */
describe('GalleryComponent', () => {
  let fixture: ComponentFixture<GalleryComponent>;
  let component: GalleryComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let api: {
    listTemplates: ReturnType<typeof vi.fn>;
    createProjectFromTemplate: ReturnType<typeof vi.fn>;
    createProject: ReturnType<typeof vi.fn>;
  };
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let brandColorsSig: ReturnType<typeof signal<string[]>>;

  const templateFactory = (id: string, name: string, tags: string[] = []): Template => ({
    _id: id,
    name,
    platform: 'ig-post',
    tags,
    canvas_json: {
      version: '7.0.0',
      objects: [{ type: 'rect', fill: '#FF3B30' }],
    },
    thumbnail_data_url: `data:image/png;base64,${id}`,
    palette_slots: [{ role: 'primary', default: '#FF3B30' }],
    is_template: true,
    created_at: '2026-04-23T00:00:00Z',
    updated_at: '2026-04-23T00:00:00Z',
  });

  const setup = async (params: { type?: string | null; templates?: Template[]; brandColors?: string[] } = {}) => {
    const type = params.type === null ? null : params.type ?? 'ig-post';
    const templates = params.templates ?? [
      templateFactory('t1', 'Template 1', ['Bold']),
      templateFactory('t2', 'Template 2', ['Minimal']),
      templateFactory('t3', 'Template 3', ['Festive']),
      templateFactory('t4', 'Template 4', ['Corporate']),
    ];
    brandColorsSig = signal<string[]>(params.brandColors ?? []);

    navigate = vi.fn().mockResolvedValue(true);
    navigateByUrl = vi.fn().mockResolvedValue(true);

    api = {
      listTemplates: vi.fn(() => of(templates)),
      createProjectFromTemplate: vi.fn(() =>
        of({
          id: 'proj-1',
          name: 'x',
          width: 1080,
          height: 1080,
          created_at: '',
          updated_at: '',
        }),
      ),
      createProject: vi.fn(() =>
        of({
          id: 'proj-blank',
          name: 'x',
          width: 1080,
          height: 1080,
          created_at: '',
          updated_at: '',
        }),
      ),
    };

    paramMapSubject = new BehaviorSubject(
      convertToParamMap(type === null ? {} : { type }),
    );

    const routeStub = {
      paramMap: paramMapSubject.asObservable(),
      snapshot: { paramMap: convertToParamMap(type === null ? {} : { type }) },
    };

    const brandKitStub: Partial<BrandKitService> = {
      brandColors: brandColorsSig.asReadonly(),
    };

    const thumbnailStub: Partial<TemplateThumbnailService> = {
      applyBrandKit: vi.fn((canvas) => canvas),
      getOrRenderThumbnail: vi.fn(async () => 'data:image/png;base64,CLIENT'),
      renderThumbnailDataUrl: vi.fn(async () => 'data:image/png;base64,CLIENT'),
      clearCache: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [GalleryComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: { navigate, navigateByUrl } },
        { provide: ApiService, useValue: api },
        { provide: BrandKitService, useValue: brandKitStub },
        { provide: TemplateThumbnailService, useValue: thumbnailStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  /** Wait for debounceTime(200) + any pending microtasks. */
  const flushDebounce = async () => {
    await new Promise((r) => setTimeout(r, 220));
    fixture.detectChanges();
  };

  describe('routing (AC-1)', () => {
    it('redirects to /hub on unknown :type', async () => {
      await setup({ type: 'nonsense' });
      expect(navigateByUrl).toHaveBeenCalledWith('/hub');
    });

    it('redirects to /hub when :type is custom (not a gallery-valid preset)', async () => {
      await setup({ type: 'custom' });
      expect(navigateByUrl).toHaveBeenCalledWith('/hub');
    });

    it('resolves preset for ig-post', async () => {
      await setup({ type: 'ig-post' });
      await flushDebounce();
      expect(component.preset()?.id).toBe('ig-post');
    });
  });

  describe('render (AC-2, AC-9)', () => {
    it('shows loading indicator while fetching', async () => {
      await setup({ type: 'ig-post' });
      // Before the debounce fires, loading is true.
      expect(component.loading()).toBe(true);
      const bar = fixture.nativeElement.querySelector('mat-progress-bar');
      expect(bar).toBeTruthy();
    });

    it('renders one tile per template after fetch', async () => {
      await setup({ type: 'ig-post' });
      await flushDebounce();
      const tiles = fixture.nativeElement.querySelectorAll('button.gallery__tile');
      expect(tiles.length).toBe(4);
      expect(api.listTemplates).toHaveBeenCalledWith('ig-post', []);
    });
  });

  describe('empty state (AC-6)', () => {
    it('shows empty state on 0 templates', async () => {
      await setup({ type: 'ig-post', templates: [] });
      await flushDebounce();
      const empty = fixture.nativeElement.querySelector('.gallery__empty');
      expect(empty).toBeTruthy();
      expect(empty.textContent).toContain('No templates');
    });
  });

  describe('filter chips (AC-5)', () => {
    it('re-fetches with selected tags on chip change', async () => {
      await setup({ type: 'ig-post' });
      await flushDebounce();
      api.listTemplates.mockClear();

      component.onChipChange({ value: ['Bold', 'Festive'] } as any);
      await flushDebounce();

      expect(api.listTemplates).toHaveBeenCalledWith('ig-post', ['Bold', 'Festive']);
    });
  });

  describe('tile click (AC-4)', () => {
    it('creates project from template + navigates to /editor/:id?platform=', async () => {
      await setup({ type: 'ig-post' });
      await flushDebounce();

      const firstTile = component.tiles()[0];
      await component.onTileActivate(firstTile);

      expect(api.createProjectFromTemplate).toHaveBeenCalled();
      const payload = api.createProjectFromTemplate.mock.calls[0][0];
      expect(payload.source_template_id).toBe('t1');
      expect(payload.platform).toBe('ig-post');
      expect(navigate).toHaveBeenCalledWith(
        ['/editor', 'proj-1'],
        { queryParams: { platform: 'ig-post' } },
      );
    });
  });

  describe('start from scratch (AC-7)', () => {
    it('creates a blank project at preset size + navigates', async () => {
      await setup({ type: 'ig-post' });
      await flushDebounce();

      await component.onStartFromScratch();

      expect(api.createProject).toHaveBeenCalledWith({
        name: 'Untitled Instagram Post',
        width: 1080,
        height: 1080,
      });
      expect(navigate).toHaveBeenCalledWith(
        ['/editor', 'proj-blank'],
        { queryParams: { platform: 'ig-post' } },
      );
    });
  });

  describe('Brand-Kit composition (AC-3)', () => {
    it('uses verbatim server thumbnail when Brand Kit is empty', async () => {
      await setup({ type: 'ig-post', brandColors: [] });
      await flushDebounce();
      const tile = component.tiles()[0];
      expect(tile.thumbnailUrl).toBe('data:image/png;base64,t1');
    });

    it('upgrades to client-rendered thumbnail when Brand Kit is non-empty', async () => {
      await setup({ type: 'ig-post', brandColors: ['#111111'] });
      await flushDebounce();
      // Give the async renderThumbnail another microtask.
      await new Promise((r) => setTimeout(r, 30));
      fixture.detectChanges();
      const tile = component.tiles()[0];
      expect(tile.thumbnailUrl).toBe('data:image/png;base64,CLIENT');
    });
  });
});
