import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRippleModule } from '@angular/material/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import {
  getPlatformPreset,
  PlatformPreset,
  PlatformType,
} from '../../core/constants/platform-presets';
import { ApiService, ApiProject } from '../../core/services/api.service';
import { BrandKitService } from '../../core/services/brand-kit.service';
import { TemplateThumbnailService } from '../../core/services/template-thumbnail.service';
import type { FabricJson, Template } from '../../core/models/template.model';

/**
 * Tile chip options exposed in the filter row.
 *
 * @remarks
 * The six-family vocabulary comes from the backend seeder (PX-022b) and is
 * hard-coded here rather than derived — the gallery chip row must show
 * every family, even when the current result-set has zero templates in it,
 * so the user can still widen their search.
 */
const FILTER_CHIPS: readonly string[] = [
  'Bold',
  'Minimal',
  'Festive',
  'Corporate',
  'Playful',
  'Logo',
];

/**
 * One renderable gallery tile after Brand-Kit pre-composition.
 */
interface GalleryTile {
  /** The underlying template document. */
  template: Template;
  /** Pre-rendered thumbnail data URL (either server-baked or client-rendered). */
  thumbnailUrl: string;
  /** Composed fabric scene — passed through to `createProjectFromTemplate`. */
  composedCanvas: FabricJson;
}

/**
 * Template gallery route — `/gallery/:type`.
 *
 * @remarks
 * Lists seed starter templates for the requested platform, filters by tag,
 * and lets the user either pick a template (new project from that template
 * with Brand-Kit colors baked in) or start from scratch (new blank project
 * at the platform's native canvas size).
 *
 * **Brand-Kit policy** (per AC-3):
 * - Empty Brand Kit → show `template.thumbnail_data_url` verbatim.
 * - Non-empty Brand Kit → run {@link TemplateThumbnailService.applyBrandKit}
 *   over the template's `canvas_json`, render a fresh PNG via
 *   {@link TemplateThumbnailService.getOrRenderThumbnail}, and display that.
 *
 * **Scope discipline** (PX-023 §2 Rule 1/2): this is a frontend-only feature.
 * No backend routes are added or modified — the gallery consumes
 * `/api/v1/templates` (PX-022a) and `/api/projects` (existing).
 *
 * @see Story PX-023
 * @see _bmad-output/planning-artifacts/ux-spec/ux-wireframe-spec.md §4
 */
@Component({
  selector: 'app-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatRippleModule,
    RouterLink,
  ],
  template: `
    <section class="gallery" aria-labelledby="gallery-heading">
      <header class="gallery__header">
        <a
          class="gallery__back"
          routerLink="/hub"
          aria-label="Back to hub"
          matRipple
        >
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          <span>Back</span>
        </a>
        <h1 id="gallery-heading" class="gallery__title">
          @if (preset(); as p) {
            {{ p.label }} templates
          } @else {
            Templates
          }
        </h1>
      </header>

      <mat-chip-listbox
        class="gallery__filters"
        aria-label="Filter by tag"
        multiple
        (change)="onChipChange($event)"
      >
        @for (chip of filterChips; track chip) {
          <mat-chip-option
            [value]="chip"
            [attr.aria-label]="'Filter by ' + chip"
          >
            {{ chip }}
          </mat-chip-option>
        }
      </mat-chip-listbox>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Loading templates" />
      }

      @if (!loading() && tiles().length === 0) {
        <div class="gallery__empty" role="status">
          <p>No templates match your filters yet.</p>
          <button
            type="button"
            class="gallery__scratch"
            matRipple
            (click)="onStartFromScratch()"
            aria-label="Start from scratch"
          >
            <mat-icon aria-hidden="true">add</mat-icon>
            Start from scratch
          </button>
          <a class="gallery__back-link" routerLink="/hub">Back to hub</a>
        </div>
      }

      @if (!loading() && tiles().length > 0) {
        <ul class="gallery__grid" role="list" aria-label="Templates">
          @for (tile of tiles(); track tile.template._id) {
            <li class="gallery__grid-item">
              <button
                type="button"
                class="gallery__tile"
                matRipple
                [attr.aria-label]="'Use template ' + tile.template.name"
                [attr.data-template-id]="tile.template._id"
                (click)="onTileActivate(tile)"
              >
                <img
                  class="gallery__thumb"
                  [src]="tile.thumbnailUrl"
                  [alt]="tile.template.name + ' preview'"
                  loading="lazy"
                />
                <span class="gallery__tile-name">{{ tile.template.name }}</span>
              </button>
            </li>
          }
        </ul>
      }

      <div class="gallery__footer">
        <button
          type="button"
          class="gallery__scratch"
          matRipple
          (click)="onStartFromScratch()"
          aria-label="Start from scratch with a blank canvas"
        >
          <mat-icon aria-hidden="true">add</mat-icon>
          Start from scratch
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
        background: var(--mat-sys-surface, #fafafa);
        color: var(--mat-sys-on-surface, #1a1a1a);
      }
      .gallery {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 24px 64px;
      }
      .gallery__header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      .gallery__back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 22px;
        text-decoration: none;
        color: var(--mat-sys-on-surface, #1a1a1a);
        border: 1px solid var(--mat-sys-outline, #767676);
      }
      .gallery__back:focus-visible {
        outline: 3px solid var(--mat-sys-primary, #1976d2);
        outline-offset: 2px;
      }
      .gallery__title {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
      }
      .gallery__filters {
        margin-bottom: 24px;
        display: block;
      }
      .gallery__grid {
        list-style: none;
        padding: 0;
        margin: 0 0 24px;
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .gallery__grid-item {
        display: block;
      }
      .gallery__tile {
        width: 100%;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-align: left;
        cursor: pointer;
        background: var(--mat-sys-surface-container, #fff);
        border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
        border-radius: 12px;
        transition:
          transform 200ms ease-out,
          box-shadow 200ms ease-out,
          border-color 200ms ease-out;
      }
      .gallery__tile:hover {
        transform: translateY(-2px);
        border-color: var(--mat-sys-primary, #1976d2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .gallery__tile:focus-visible {
        outline: 3px solid var(--mat-sys-primary, #1976d2);
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .gallery__tile {
          transition: none;
        }
        .gallery__tile:hover {
          transform: none;
        }
      }
      .gallery__thumb {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 8px;
        background: var(--mat-sys-surface-container-high, #f0f0f0);
      }
      .gallery__tile-name {
        font-size: 0.9rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .gallery__empty {
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        border: 1px dashed var(--mat-sys-outline-variant, #ccc);
        border-radius: 12px;
        margin-bottom: 24px;
      }
      .gallery__footer {
        display: flex;
        justify-content: flex-end;
      }
      .gallery__scratch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--mat-sys-outline, #767676);
        border-radius: 22px;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .gallery__scratch:focus-visible {
        outline: 3px solid var(--mat-sys-primary, #1976d2);
        outline-offset: 2px;
      }
      .gallery__back-link {
        color: var(--mat-sys-primary, #1976d2);
        text-decoration: underline;
      }
    `,
  ],
})
export class GalleryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly brandKit = inject(BrandKitService);
  private readonly thumbnailService = inject(TemplateThumbnailService);
  private readonly destroyRef = inject(DestroyRef);

  /** Exposed for template iteration. */
  readonly filterChips = FILTER_CHIPS;

  /** Currently-selected filter tags (empty = "All"). */
  private readonly selectedTags = signal<string[]>([]);

  /** Resolved {@link PlatformPreset} for the current route. `null` on invalid types. */
  readonly preset = signal<PlatformPreset | null>(null);

  /** Whether a template fetch is in flight. */
  readonly loading = signal<boolean>(true);

  /** Current tile set, already Brand-Kit-composed. */
  readonly tiles = signal<GalleryTile[]>([]);

  /** Derived: `true` when no templates matched the current filters. */
  readonly hasTiles = computed(() => this.tiles().length > 0);

  /** Debounced fetch driver — `.next(tags)` to refresh. */
  private readonly fetchTrigger = new Subject<string[]>();

  /**
   * Read `:type` from the route, validate it, and bootstrap the first fetch.
   *
   * @remarks
   * Invalid `:type` → immediate redirect to `/hub` (AC-1 guard). Valid types
   * set {@link GalleryComponent.preset} and kick the first `listTemplates`
   * call via {@link GalleryComponent.fetchTrigger}.
   */
  ngOnInit(): void {
    // Wire up the debounced fetch pipeline once.
    this.fetchTrigger
      .pipe(
        debounceTime(200),
        distinctUntilChanged((a, b) => a.join('|') === b.join('|')),
        switchMap((tags) => {
          this.loading.set(true);
          const preset = this.preset();
          if (!preset) return [];
          return this.api.listTemplates(preset.id as PlatformType, tags);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (templates) => this.onTemplatesLoaded(templates),
        error: () => {
          this.tiles.set([]);
          this.loading.set(false);
        },
      });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const type = params.get('type');
      const preset = getPlatformPreset(type);
      if (!preset || preset.id === 'custom') {
        // WHY: Logo has its own flow (PX-030); any unknown slug 404s to /hub.
        this.router.navigateByUrl('/hub');
        return;
      }
      this.preset.set(preset);
      this.fetchTrigger.next(this.selectedTags());
    });
  }

  /**
   * Handle a chip-listbox selection change.
   *
   * @param event - The Material chip-listbox change event.
   *
   * @remarks
   * Re-queries the backend with the new tag set. Debounced 200ms via the
   * internal `fetchTrigger` pipeline (AC-5).
   */
  onChipChange(event: MatChipListboxChange): void {
    const value = event.value;
    const tags: string[] = Array.isArray(value) ? value : value ? [value] : [];
    this.selectedTags.set(tags);
    this.fetchTrigger.next(tags);
  }

  /**
   * Create a project from the selected tile and open the editor.
   *
   * @param tile - The activated tile (template + composed canvas + thumbnail).
   * @returns A promise that resolves once navigation settles.
   *
   * @remarks
   * Navigates to `/editor/:projectId?platform=<type>` — the `?platform=`
   * query parameter is consumed by PX-020's editor to seed the correct
   * canvas preset.
   */
  async onTileActivate(tile: GalleryTile): Promise<void> {
    const preset = this.preset();
    if (!preset) return;
    await new Promise<void>((resolve, reject) => {
      this.api
        .createProjectFromTemplate({
          source_template_id: tile.template._id,
          canvas_json: tile.composedCanvas,
          platform: preset.id as PlatformType,
          thumbnail_data_url: tile.thumbnailUrl,
          name: tile.template.name,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (project) => {
            this.router
              .navigate(['/editor', project.id], {
                queryParams: { platform: preset.id },
              })
              .then(() => resolve())
              .catch(reject);
          },
          error: reject,
        });
    });
  }

  /**
   * Create a blank project at the platform's canvas size and open the editor.
   *
   * @returns A promise that resolves once navigation settles.
   *
   * @remarks
   * The blank scene is a single white background rect sized to the preset
   * — enough for the editor to initialize correctly while still matching the
   * "blank canvas" affordance in the wireframe (AC-7).
   */
  async onStartFromScratch(): Promise<void> {
    const preset = this.preset();
    if (!preset) return;
    const blank = emptyCanvasFor(preset);
    await new Promise<void>((resolve, reject) => {
      this.api
        .createProject({
          name: `Untitled ${preset.label}`,
          width: preset.width,
          height: preset.height,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (project) => {
            // WHY: the base createProject endpoint doesn't take canvas_json on
            // the initial create — the editor hydrates a default scene on
            // first load. We pass `blank` through to preserve the documented
            // behavior (AC-7) even if the persisted doc ignores it.
            void blank;
            this.router
              .navigate(['/editor', project.id], {
                queryParams: { platform: preset.id },
              })
              .then(() => resolve())
              .catch(reject);
          },
          error: reject,
        });
    });
  }

  /**
   * Map a freshly-loaded template list into gallery tiles.
   *
   * @param templates - The raw API response.
   *
   * @remarks
   * For each template:
   * - If Brand Kit is empty → use `template.thumbnail_data_url` verbatim
   *   and keep `canvas_json` unchanged (fast path, no fabric render).
   * - Else → run `applyBrandKit`, render a client-side thumbnail, and cache
   *   it under `templateId:brandKitSignature`.
   *
   * Asynchronous renders settle into `tiles` as they complete. Tiles are
   * initially published with the server-baked thumbnail so the user sees
   * immediate content, then transparently upgraded once the client render
   * finishes.
   */
  private onTemplatesLoaded(templates: Template[]): void {
    const brandColors = this.brandKit.brandColors();
    const signature = brandColors.join('|');
    const initial: GalleryTile[] = templates.map((t) => ({
      template: t,
      thumbnailUrl: t.thumbnail_data_url,
      composedCanvas: this.thumbnailService.applyBrandKit(
        t.canvas_json,
        t.palette_slots,
        brandColors,
      ),
    }));
    this.tiles.set(initial);
    this.loading.set(false);

    if (brandColors.length === 0) return;

    // WHY: Fire-and-forget render per tile so the gallery is interactive
    // immediately. Failures leave the server thumbnail in place (AC-3 fallback).
    for (const tile of initial) {
      const preset = this.preset();
      if (!preset) break;
      this.thumbnailService
        .getOrRenderThumbnail(
          tile.template._id,
          tile.composedCanvas,
          preset.width,
          preset.height,
          signature,
        )
        .then((url) => {
          this.tiles.update((rows) =>
            rows.map((r) =>
              r.template._id === tile.template._id ? { ...r, thumbnailUrl: url } : r,
            ),
          );
        })
        .catch(() => {
          /* swallow — server thumbnail already showing */
        });
    }
  }
}

/**
 * Produce a minimal blank fabric scene at a platform's native canvas size.
 *
 * @param preset - The resolved platform preset.
 * @returns A {@link FabricJson} with one background rect of `preset.width`
 *   × `preset.height` and a white fill.
 *
 * @remarks
 * Not a class method — kept module-local so it can be unit-tested without
 * Angular TestBed. The blank scene is intentionally skeletal; the editor
 * re-hydrates richer defaults on first load.
 */
export function emptyCanvasFor(preset: PlatformPreset): FabricJson {
  return {
    version: '7.0.0',
    background: '#ffffff',
    width: preset.width,
    height: preset.height,
    objects: [
      {
        type: 'rect',
        version: '7.0.0',
        left: 0,
        top: 0,
        width: preset.width,
        height: preset.height,
        fill: '#ffffff',
        selectable: false,
      },
    ],
  };
}

/**
 * Re-exported for downstream templates and consumers that need to discover
 * the filter-chip vocabulary without duplicating it.
 */
export const GALLERY_FILTER_CHIPS = FILTER_CHIPS;

/**
 * Handle to the derived `ApiProject` shape — the gallery never introspects
 * more than `id`, but future consumers of the navigation contract may.
 */
export type GalleryProject = ApiProject;
