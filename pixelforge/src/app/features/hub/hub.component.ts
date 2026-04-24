import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  PLATFORM_PRESETS,
  PlatformPreset,
  PlatformType,
} from '../../core/constants/platform-presets';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';

/**
 * One renderable tile on the `/hub` grid.
 *
 * @remarks
 * Five tiles are derived from {@link PLATFORM_PRESETS} (excluding the `custom`
 * sentinel). A sixth tile — `Logo` — is hard-coded because no canvas-preset
 * exists for it (the Logo flow routes to a mode-chooser first).
 *
 * @see PX-010 AC-1, AC-2, AC-3
 */
export interface HubTile {
  /** Stable identifier. Matches {@link PlatformType} for platform tiles, `'logo'` for the Logo tile. */
  id: PlatformType | 'logo';
  /** Human-readable label shown on the tile (e.g. `"Instagram Post"`). */
  label: string;
  /**
   * Secondary label. Dimensions string (`"1080×1080"`) for platform tiles, or
   * `"Make a logo"` for the Logo tile.
   */
  subtitle: string;
  /** Material icon ligature for the tile's leading glyph. */
  icon: string;
  /** Absolute router path the tile navigates to on activation. */
  route: string;
  /** Full aria-label for screen readers (includes subtitle context). */
  ariaLabel: string;
}

/**
 * Map of platform preset `id` → gallery slug used in `/gallery/:type`.
 *
 * @remarks
 * The gallery route accepts the same preset id today, but this indirection
 * keeps routing concerns decoupled from the preset constants file — the UX
 * spec names the slugs (`ig-post`, `yt-thumb`, etc.) and this map enforces
 * them.
 */
const GALLERY_SLUG_BY_PRESET: Readonly<Record<Exclude<PlatformType, 'custom'>, string>> = {
  'ig-post': 'ig-post',
  'ig-story': 'ig-story',
  'linkedin-post': 'linkedin-post',
  'linkedin-banner': 'linkedin-banner',
  'yt-thumb': 'yt-thumb',
};

/**
 * Landing hub (`/hub`) — a 6-tile content-type chooser plus a recent-projects strip.
 *
 * @remarks
 * Per UX spec §3, this is the front door for authenticated users. Five tiles
 * are platform-size presets pulled from {@link PLATFORM_PRESETS}; the sixth
 * is a hard-coded Logo tile that routes to `/logo/mode-chooser`. A horizontal
 * strip below the grid surfaces up to 8 recent projects from
 * {@link ProjectService.projects}.
 *
 * Zoneless + signals-first. Uses Angular Material for the icon container,
 * ripple effect, and tooltip only — no Material page-level shell.
 *
 * @see Story PX-010
 * @see _bmad-output/planning-artifacts/ux-spec/ux-wireframe-spec.md §3
 */
@Component({
  selector: 'app-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatRippleModule, MatTooltipModule],
  template: `
    <section class="hub" aria-labelledby="hub-heading">
      <header class="hub__header">
        <h1 id="hub-heading" class="hub__title">What would you like to make today?</h1>
      </header>

      <ul class="hub__grid" role="list" aria-label="Content type choices">
        @for (tile of tiles; track trackTileById($index, tile)) {
          <li class="hub__grid-item">
            <button
              type="button"
              class="hub__tile"
              matRipple
              [attr.aria-label]="tile.ariaLabel"
              [attr.data-tile-id]="tile.id"
              (click)="onTileActivate(tile)"
            >
              <span class="hub__tile-icon" aria-hidden="true">
                <mat-icon>{{ tile.icon }}</mat-icon>
              </span>
              <span class="hub__tile-label">{{ tile.label }}</span>
              <span class="hub__tile-subtitle">{{ tile.subtitle }}</span>
            </button>
          </li>
        }
      </ul>

      <section class="hub__recent" aria-labelledby="hub-recent-heading">
        <div class="hub__recent-head">
          <h2 id="hub-recent-heading" class="hub__subheading">Recent projects</h2>
          <button
            type="button"
            class="hub__scratch"
            matRipple
            aria-label="Start from scratch"
            (click)="onStartFromScratch()"
          >
            <mat-icon aria-hidden="true">add</mat-icon>
            <span>Start from scratch</span>
          </button>
        </div>

        @if (hasProjects()) {
          <ul class="hub__recent-strip" role="list" aria-label="Recent projects">
            @for (project of projects(); track trackProjectById($index, project)) {
              <li class="hub__recent-item">
                <button
                  type="button"
                  class="hub__recent-tile"
                  matRipple
                  [attr.aria-label]="'Open project ' + project.name"
                  (click)="onProjectActivate(project)"
                >
                  @if (project.thumbnail) {
                    <img
                      class="hub__recent-thumb"
                      [src]="project.thumbnail"
                      alt=""
                      loading="lazy"
                    />
                  } @else {
                    <span
                      class="hub__recent-thumb hub__recent-thumb--placeholder"
                      aria-hidden="true"
                    >
                      <mat-icon>image</mat-icon>
                    </span>
                  }
                  <span class="hub__recent-name">{{ project.name }}</span>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="hub__recent-empty">
            No recent projects yet. Pick a tile above to get started.
          </p>
        }
      </section>
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
      .hub {
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 24px 64px;
      }
      .hub__header {
        margin-bottom: 32px;
      }
      .hub__title {
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
        line-height: 1.2;
      }
      .hub__subheading {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
      }
      .hub__grid {
        list-style: none;
        padding: 0;
        margin: 0 0 48px;
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @media (max-width: 1023px) {
        .hub__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 639px) {
        .hub__grid {
          grid-template-columns: 1fr;
        }
      }
      .hub__grid-item {
        display: block;
      }
      .hub__tile {
        min-height: 160px;
        width: 100%;
        padding: 20px;
        background: var(--mat-sys-surface-container, #fff);
        border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
        border-radius: 16px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 8px;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        transition:
          transform 200ms ease-out,
          box-shadow 200ms ease-out,
          border-color 200ms ease-out;
      }
      .hub__tile:hover {
        transform: translateY(-2px);
        border-color: var(--mat-sys-primary, #1976d2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      .hub__tile:focus-visible {
        outline: 3px solid var(--mat-sys-primary, #1976d2);
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .hub__tile {
          transition: none;
        }
        .hub__tile:hover {
          transform: none;
        }
      }
      .hub__tile-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--mat-sys-primary-container, rgba(25, 118, 210, 0.12));
        color: var(--mat-sys-on-primary-container, #0d47a1);
      }
      .hub__tile-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .hub__tile-label {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface, #1a1a1a);
      }
      .hub__tile-subtitle {
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant, #555);
      }
      .hub__recent {
        margin-top: 16px;
      }
      .hub__recent-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }
      .hub__scratch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 8px 16px;
        background: transparent;
        border: 1px solid var(--mat-sys-outline, #767676);
        border-radius: 22px;
        color: var(--mat-sys-on-surface, #1a1a1a);
        cursor: pointer;
        font-size: 0.9rem;
      }
      .hub__scratch:hover {
        background: var(--mat-sys-surface-container-high, rgba(0, 0, 0, 0.04));
      }
      .hub__scratch:focus-visible {
        outline: 3px solid var(--mat-sys-primary, #1976d2);
        outline-offset: 2px;
      }
      .hub__recent-strip {
        list-style: none;
        padding: 0 0 8px;
        margin: 0;
        display: flex;
        gap: 12px;
        overflow-x: auto;
        scroll-snap-type: x proximity;
      }
      .hub__recent-item {
        flex: 0 0 auto;
        scroll-snap-align: start;
      }
      .hub__recent-tile {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 140px;
        padding: 8px;
        background: var(--mat-sys-surface-container, #fff);
        border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
      }
      .hub__recent-tile:focus-visible {
        outline: 3px solid var(--mat-sys-primary, #1976d2);
        outline-offset: 2px;
      }
      .hub__recent-thumb {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 8px;
        background: var(--mat-sys-surface-container-high, #f0f0f0);
      }
      .hub__recent-thumb--placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--mat-sys-on-surface-variant, #888);
      }
      .hub__recent-name {
        font-size: 0.85rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .hub__recent-empty {
        margin: 0;
        color: var(--mat-sys-on-surface-variant, #666);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class HubComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  /**
   * The 6 tiles rendered in the hub grid, in UX-spec order.
   *
   * @remarks
   * Computed once at class-init time since {@link PLATFORM_PRESETS} is a
   * compile-time constant.
   */
  readonly tiles: readonly HubTile[] = HubComponent.buildTiles();

  /**
   * Local signal mirror of the most recent projects, capped at 8.
   *
   * @remarks
   * Seeded on `ngOnInit` from {@link ProjectService.projects}. If the project
   * list fails to load (or is unavailable), stays empty — the template then
   * renders an empty-state message.
   */
  readonly projects = signal<Project[]>([]);

  /**
   * Derived flag — `true` when no recent projects are available.
   *
   * @remarks
   * Drives the empty-state message vs. the horizontal strip.
   */
  readonly hasProjects = computed(() => this.projects().length > 0);

  /**
   * Seed the recent-projects signal from {@link ProjectService}.
   *
   * @remarks
   * Boundary-wrapped in try/catch only because `ProjectService` reads from
   * `localStorage` during construction and could theoretically throw in a
   * privacy-mode browser. Failure is degraded to an empty list so the hub
   * still renders.
   */
  ngOnInit(): void {
    try {
      const recent = this.projectService.projects().slice(0, 8);
      this.projects.set(recent);
    } catch {
      this.projects.set([]);
    }
  }

  /**
   * Navigate to the route associated with the given tile.
   *
   * @param tile - The activated tile.
   * @returns A promise that resolves once navigation settles.
   *
   * @example
   * ```ts
   * onTileActivate(hubTile); // routes to /gallery/ig-post or /logo/mode-chooser
   * ```
   */
  onTileActivate(tile: HubTile): Promise<boolean> {
    return this.router.navigateByUrl(tile.route);
  }

  /**
   * Navigate to the editor for a recent project.
   *
   * @param project - The selected recent project.
   * @returns A promise that resolves once navigation settles.
   */
  onProjectActivate(project: Project): Promise<boolean> {
    return this.router.navigateByUrl(`/editor/${project.id}`);
  }

  /**
   * "Start from scratch" affordance — stub per PX-010 scope.
   *
   * @remarks
   * The UX spec calls for reuse of an existing canvas-size dialog. No such
   * standalone dialog exists in the current codebase, so this story stubs
   * the affordance as a no-op (tracked as a follow-up per PX-010 brief).
   * Keeping the method here so the template binding is stable.
   */
  onStartFromScratch(): void {
    // WHY: stub — canvas-size dialog reuse is tracked as a follow-up story.
  }

  /**
   * `@for` track-by helper for the tile grid.
   *
   * @param _index - The tile's index (unused).
   * @param tile - The current tile.
   * @returns The tile's stable id.
   */
  trackTileById(_index: number, tile: HubTile): string {
    return tile.id;
  }

  /**
   * `@for` track-by helper for the recent-projects strip.
   *
   * @param _index - The project's index (unused).
   * @param project - The current project.
   * @returns The project's stable id.
   */
  trackProjectById(_index: number, project: Project): string {
    return project.id;
  }

  /**
   * Build the 6-tile list from the platform-presets constants file.
   *
   * @returns A frozen list of {@link HubTile} entries in UX-spec order.
   *
   * @remarks
   * Pure static builder so the result can be assigned to a `readonly`
   * instance field without per-instance overhead.
   */
  private static buildTiles(): readonly HubTile[] {
    const platformTiles: HubTile[] = PLATFORM_PRESETS
      .filter((preset): preset is PlatformPreset & { id: Exclude<PlatformType, 'custom'> } =>
        preset.id !== 'custom',
      )
      .map((preset) => ({
        id: preset.id,
        label: preset.label,
        subtitle: `${preset.width}×${preset.height}`,
        icon: preset.icon ?? 'image',
        route: `/gallery/${GALLERY_SLUG_BY_PRESET[preset.id]}`,
        ariaLabel: `${preset.label}, ${preset.width} by ${preset.height} pixels`,
      }));

    const logoTile: HubTile = {
      id: 'logo',
      label: 'Logo',
      subtitle: 'Make a logo',
      icon: 'auto_awesome',
      route: '/logo/mode-chooser',
      ariaLabel: 'Logo, make a logo',
    };

    return Object.freeze([...platformTiles, logoTile]);
  }
}
