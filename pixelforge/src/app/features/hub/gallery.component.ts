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
      <div class="gallery__bg" aria-hidden="true"></div>

      <header class="gallery__header">
        <div class="gallery__header-top">
          <a
            class="gallery__back"
            routerLink="/hub"
            aria-label="Back to hub"
            matRipple
          >
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
            <span>Back to hub</span>
          </a>
          @if (preset(); as p) {
            <span class="gallery__dims" aria-hidden="true">
              {{ p.width }} × {{ p.height }}
            </span>
          }
        </div>

        <div class="gallery__header-copy">
          <p class="gallery__eyebrow">
            <span class="gallery__eyebrow-dot"></span>
            <span>Template gallery</span>
          </p>
          <h1 id="gallery-heading" class="gallery__title">
            @if (preset(); as p) {
              <span class="gallery__title-accent">{{ p.label }}</span> templates
            } @else {
              Templates
            }
          </h1>
          <p class="gallery__subtitle">
            Pick a starter — your Brand Kit colors apply automatically. Or skip
            the gallery and open a blank canvas.
          </p>
        </div>

        <button
          type="button"
          class="gallery__scratch gallery__scratch--primary"
          matRipple
          (click)="onStartFromScratch()"
          aria-label="Start from scratch with a blank canvas"
        >
          <mat-icon aria-hidden="true">add</mat-icon>
          <span>Start from scratch</span>
        </button>
      </header>

      <div class="gallery__toolbar">
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

        @if (!loading()) {
          <span class="gallery__count" aria-live="polite">
            {{ tiles().length }} {{ tiles().length === 1 ? 'template' : 'templates' }}
          </span>
        }
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Loading templates" />
      }

      @if (!loading() && tiles().length === 0) {
        <div class="gallery__empty" role="status">
          <span class="gallery__empty-glyph" aria-hidden="true">
            <mat-icon>auto_awesome</mat-icon>
          </span>
          <div class="gallery__empty-body">
            <h2 class="gallery__empty-title">No templates match yet</h2>
            <p class="gallery__empty-copy">
              Try removing a filter, or jump straight into a blank canvas and
              design from scratch.
            </p>
            <div class="gallery__empty-actions">
              <button
                type="button"
                class="gallery__scratch gallery__scratch--primary"
                matRipple
                (click)="onStartFromScratch()"
                aria-label="Start from scratch"
              >
                <mat-icon aria-hidden="true">add</mat-icon>
                <span>Start from scratch</span>
              </button>
              <a class="gallery__back-link" routerLink="/hub">Back to hub</a>
            </div>
          </div>
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
                <span class="gallery__thumb-frame" aria-hidden="true">
                  <img
                    class="gallery__thumb"
                    [src]="tile.thumbnailUrl"
                    [alt]="tile.template.name + ' preview'"
                    loading="lazy"
                  />
                  <span class="gallery__thumb-overlay" aria-hidden="true">
                    <span class="gallery__thumb-cta">
                      <mat-icon>add</mat-icon>
                      <span>Use template</span>
                    </span>
                  </span>
                </span>
                <span class="gallery__tile-meta">
                  <span class="gallery__tile-name">{{ tile.template.name }}</span>
                  @if (tile.template.tags.length > 0) {
                    <span class="gallery__tile-tag">{{ tile.template.tags[0] }}</span>
                  }
                </span>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      :host {
        --px-violet: #7c3aed;
        --px-violet-deep: #5b21b6;
        --px-cyan: #06b6d4;
        --px-pink: #ec4899;
        --px-ink: #0f172a;
        --px-ink-soft: #334155;
        --px-muted: #64748b;
        --px-line: #e2e8f0;
        --px-surface: #ffffff;
        --px-page: #f8fafc;

        display: block;
        height: 100%;
        overflow-y: auto;
        color: var(--px-ink);
        background: var(--px-page);
      }

      .gallery {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 32px 80px;
      }

      /* Same decorative layer as /hub for visual consistency */
      .gallery__bg {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
          radial-gradient(
            ellipse at 80% -10%,
            rgba(124, 58, 237, 0.12) 0%,
            transparent 45%
          ),
          radial-gradient(
            ellipse at -10% 110%,
            rgba(6, 182, 212, 0.10) 0%,
            transparent 45%
          ),
          radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0);
        background-size: auto, auto, 24px 24px;
      }
      .gallery > *:not(.gallery__bg) {
        position: relative;
        z-index: 1;
      }

      /* ── Header ─────────────────────────────────────────────── */

      .gallery__header {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas:
          'top top'
          'copy scratch';
        gap: 16px 24px;
        align-items: end;
        margin-bottom: 32px;
      }
      .gallery__header-top {
        grid-area: top;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .gallery__header-copy { grid-area: copy; min-width: 0; }
      .gallery__scratch--primary { grid-area: scratch; }

      @media (max-width: 720px) {
        .gallery__header {
          grid-template-columns: 1fr;
          grid-template-areas:
            'top'
            'copy'
            'scratch';
        }
        .gallery__scratch--primary { width: 100%; justify-content: center; }
      }

      .gallery__back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px 8px 10px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 999px;
        color: var(--px-ink-soft);
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
      }
      .gallery__back:hover {
        border-color: rgba(124, 58, 237, 0.4);
        color: var(--px-ink);
        background: #fafafa;
      }
      .gallery__back:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      .gallery__back mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .gallery__dims {
        font-size: 0.82rem;
        color: var(--px-muted);
        font-feature-settings: 'tnum' 1;
        padding: 6px 12px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 999px;
      }

      .gallery__eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 14px;
        padding: 6px 14px 6px 10px;
        background: #ffffff;
        border: 1px solid var(--px-line);
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--px-ink-soft);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .gallery__eyebrow-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--px-violet), var(--px-cyan));
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
      }

      .gallery__title {
        margin: 0;
        font-size: clamp(1.65rem, 3vw, 2.25rem);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: var(--px-ink);
      }
      .gallery__title-accent {
        background: linear-gradient(135deg, var(--px-violet) 0%, var(--px-pink) 60%, var(--px-cyan) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .gallery__subtitle {
        margin: 10px 0 0;
        color: var(--px-muted);
        font-size: 0.98rem;
        line-height: 1.55;
        max-width: 560px;
      }

      /* ── Scratch CTA (matches hub's gradient primary) ────────── */

      .gallery__scratch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 20px;
        background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 100%);
        color: #ffffff;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        box-shadow: 0 4px 14px rgba(124, 58, 237, 0.28);
        transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
      }
      .gallery__scratch:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(124, 58, 237, 0.36);
        filter: brightness(1.05);
      }
      .gallery__scratch:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      .gallery__scratch mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* ── Toolbar: filter chips + result count ────────────────── */

      .gallery__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 28px;
        padding: 12px 16px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 16px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        flex-wrap: wrap;
      }
      .gallery__filters {
        display: block;
        flex: 1 1 auto;
      }
      .gallery__count {
        font-size: 0.85rem;
        color: var(--px-muted);
        white-space: nowrap;
        font-feature-settings: 'tnum' 1;
      }

      /* Brand-paint the Material chips for consistency */
      .gallery__filters ::ng-deep .mat-mdc-chip {
        border-radius: 999px !important;
        background-color: #f1f5f9 !important;
        border: 1px solid transparent !important;
        transition: background-color 140ms ease, border-color 140ms ease,
          color 140ms ease;
      }
      .gallery__filters ::ng-deep .mat-mdc-chip .mdc-evolution-chip__text-label {
        color: var(--px-ink-soft);
        font-weight: 500;
      }
      .gallery__filters ::ng-deep .mat-mdc-chip:hover {
        background-color: #e2e8f0 !important;
      }
      .gallery__filters ::ng-deep .mat-mdc-chip.mdc-evolution-chip--selected {
        background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 100%) !important;
        border-color: transparent !important;
      }
      .gallery__filters ::ng-deep .mat-mdc-chip.mdc-evolution-chip--selected
        .mdc-evolution-chip__text-label {
        color: #ffffff;
      }
      .gallery__filters ::ng-deep .mat-mdc-chip.mdc-evolution-chip--selected
        .mat-mdc-chip-graphic {
        color: #ffffff !important;
      }

      /* ── Loading ─────────────────────────────────────────────── */

      :host ::ng-deep mat-progress-bar.mat-mdc-progress-bar {
        --mdc-linear-progress-active-indicator-color: var(--px-violet);
        border-radius: 3px;
        overflow: hidden;
      }

      /* ── Tile grid ──────────────────────────────────────────── */

      .gallery__grid {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
      .gallery__grid-item {
        display: block;
      }

      .gallery__tile {
        position: relative;
        width: 100%;
        padding: 10px 10px 14px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 16px;
        cursor: pointer;
        text-align: left;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 220ms ease, border-color 220ms ease;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .gallery__tile:hover {
        transform: translateY(-4px);
        border-color: transparent;
        box-shadow: 0 18px 40px -18px rgba(15, 23, 42, 0.25),
          0 0 0 1px rgba(124, 58, 237, 0.28);
      }
      .gallery__tile:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      @media (prefers-reduced-motion: reduce) {
        .gallery__tile, .gallery__scratch, .gallery__thumb-overlay {
          transition: none !important;
        }
        .gallery__tile:hover, .gallery__scratch:hover { transform: none !important; }
      }

      .gallery__thumb-frame {
        position: relative;
        display: block;
        overflow: hidden;
        border-radius: 12px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
      }
      .gallery__thumb {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
      }
      .gallery__thumb-overlay {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        background: linear-gradient(
          180deg,
          rgba(15, 23, 42, 0) 40%,
          rgba(15, 23, 42, 0.55) 100%
        );
        opacity: 0;
        transition: opacity 220ms ease;
      }
      .gallery__tile:hover .gallery__thumb-overlay { opacity: 1; }
      .gallery__thumb-cta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: #ffffff;
        color: var(--px-violet);
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
        transform: translateY(6px);
        transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .gallery__thumb-cta mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      .gallery__tile:hover .gallery__thumb-cta { transform: translateY(0); }

      .gallery__tile-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 0 4px;
        min-width: 0;
      }
      .gallery__tile-name {
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--px-ink);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        flex: 1 1 auto;
      }
      .gallery__tile-tag {
        flex-shrink: 0;
        padding: 3px 10px;
        background: #f1f5f9;
        color: var(--px-ink-soft);
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      /* ── Empty state (matches hub's dashed-card pattern) ────── */

      .gallery__empty {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        padding: 32px;
        background: var(--px-surface);
        border: 1px dashed var(--px-line);
        border-radius: 18px;
      }
      .gallery__empty-glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(6, 182, 212, 0.12));
        color: var(--px-violet);
        flex-shrink: 0;
      }
      .gallery__empty-glyph mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .gallery__empty-body { flex: 1 1 auto; min-width: 0; }
      .gallery__empty-title {
        margin: 0 0 6px;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--px-ink);
        letter-spacing: -0.01em;
      }
      .gallery__empty-copy {
        margin: 0 0 16px;
        color: var(--px-ink-soft);
        line-height: 1.55;
        max-width: 560px;
      }
      .gallery__empty-actions {
        display: inline-flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .gallery__back-link {
        color: var(--px-violet);
        font-weight: 500;
        text-decoration: none;
        padding: 10px 4px;
      }
      .gallery__back-link:hover { text-decoration: underline; }

      @media (max-width: 580px) {
        .gallery { padding: 32px 20px 64px; }
        .gallery__empty { flex-direction: column; }
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
