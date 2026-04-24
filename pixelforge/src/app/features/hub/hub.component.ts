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
      <div class="hub__bg" aria-hidden="true"></div>

      <header class="hub__header">
        <div class="hub__header-copy">
          <p class="hub__eyebrow">
            <span class="hub__eyebrow-dot"></span>
            <span>Pixelforge Studio</span>
          </p>
          <h1 id="hub-heading" class="hub__title">
            Create something <span class="hub__title-accent">brilliant</span> today
          </h1>
          <p class="hub__subtitle">
            Pick a canvas, start from scratch, or jump back into a recent project.
          </p>
        </div>
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
      </header>

      <section class="hub__section" aria-labelledby="hub-make-heading">
        <div class="hub__section-head">
          <h2 id="hub-make-heading" class="hub__section-title">What will you make?</h2>
          <span class="hub__section-meta">6 canvas presets</span>
        </div>

        <ul class="hub__grid" role="list" aria-label="Content type choices">
          @for (tile of tiles; track trackTileById($index, tile)) {
            <li class="hub__grid-item">
              <button
                type="button"
                class="hub__tile"
                [class]="'hub__tile--' + tile.id"
                matRipple
                [attr.aria-label]="tile.ariaLabel"
                [attr.data-tile-id]="tile.id"
                (click)="onTileActivate(tile)"
              >
                <span class="hub__tile-bg" aria-hidden="true"></span>

                <span class="hub__tile-preview" aria-hidden="true">
                  <span class="hub__tile-frame" [attr.data-tile-id]="tile.id"></span>
                </span>

                <span class="hub__tile-body">
                  <span class="hub__tile-icon" aria-hidden="true">
                    <mat-icon>{{ tile.icon }}</mat-icon>
                  </span>
                  <span class="hub__tile-text">
                    <span class="hub__tile-label">{{ tile.label }}</span>
                    <span class="hub__tile-subtitle">{{ tile.subtitle }}</span>
                  </span>
                  <span class="hub__tile-arrow" aria-hidden="true">
                    <mat-icon>arrow_forward</mat-icon>
                  </span>
                </span>
              </button>
            </li>
          }
        </ul>
      </section>

      <section class="hub__section hub__recent" aria-labelledby="hub-recent-heading">
        <div class="hub__section-head">
          <h2 id="hub-recent-heading" class="hub__section-title">Recent projects</h2>
          @if (hasProjects()) {
            <span class="hub__section-meta">{{ projects().length }} recent</span>
          }
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
          <div class="hub__recent-empty">
            <span class="hub__recent-empty-glyph" aria-hidden="true">
              <mat-icon>auto_awesome</mat-icon>
            </span>
            <p class="hub__recent-empty-copy">
              No recent projects yet. Pick a canvas above to get started.
            </p>
          </div>
        }
      </section>
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
        min-height: 100%;
        color: var(--px-ink);
        background: var(--px-page);
        font-family: var(--mat-sys-body-medium-font, 'Inter', -apple-system, BlinkMacSystemFont,
          'Segoe UI', Roboto, sans-serif);
      }

      .hub {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
        padding: 64px 32px 80px;
      }

      /* ── Decorative background: soft dotted grid + gradient orb ──────── */

      .hub__bg {
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

      .hub > *:not(.hub__bg) {
        position: relative;
        z-index: 1;
      }

      /* ── Header ──────────────────────────────────────────────────── */

      .hub__header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 48px;
        flex-wrap: wrap;
      }

      .hub__header-copy {
        flex: 1 1 360px;
        min-width: 0;
      }

      .hub__eyebrow {
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
      .hub__eyebrow-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--px-violet), var(--px-cyan));
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
      }

      .hub__title {
        margin: 0;
        font-size: clamp(1.75rem, 3vw, 2.5rem);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: var(--px-ink);
      }
      .hub__title-accent {
        background: linear-gradient(135deg, var(--px-violet) 0%, var(--px-pink) 60%, var(--px-cyan) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .hub__subtitle {
        margin: 12px 0 0;
        color: var(--px-muted);
        font-size: 1.02rem;
        line-height: 1.5;
        max-width: 560px;
      }

      .hub__scratch {
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
      .hub__scratch:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(124, 58, 237, 0.36);
        filter: brightness(1.05);
      }
      .hub__scratch:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      .hub__scratch mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* ── Sections ────────────────────────────────────────────────── */

      .hub__section {
        margin-bottom: 56px;
      }
      .hub__section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
      }
      .hub__section-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--px-ink);
        letter-spacing: -0.01em;
      }
      .hub__section-meta {
        font-size: 0.85rem;
        color: var(--px-muted);
      }

      /* ── Tile grid ───────────────────────────────────────────────── */

      .hub__grid {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      @media (max-width: 1023px) {
        .hub__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 580px) {
        .hub__grid {
          grid-template-columns: 1fr;
        }
      }
      .hub__grid-item {
        display: block;
      }

      /* ── Tile ────────────────────────────────────────────────────── */

      .hub__tile {
        position: relative;
        overflow: hidden;
        width: 100%;
        padding: 0;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 18px;
        cursor: pointer;
        text-align: left;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
          box-shadow 220ms ease, border-color 220ms ease;
        display: flex;
        flex-direction: column;
      }
      .hub__tile:hover {
        transform: translateY(-4px);
        border-color: transparent;
        box-shadow: 0 18px 40px -18px rgba(15, 23, 42, 0.25),
          0 0 0 1px rgba(124, 58, 237, 0.28);
      }
      .hub__tile:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      @media (prefers-reduced-motion: reduce) {
        .hub__tile, .hub__scratch, .hub__tile-arrow {
          transition: none !important;
        }
        .hub__tile:hover, .hub__scratch:hover { transform: none !important; }
      }

      /* Tile background — radial tint that intensifies on hover */
      .hub__tile-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at 100% 0%,
          var(--tile-a, rgba(124, 58, 237, 0.10)) 0%,
          transparent 60%
        );
        opacity: 0.6;
        transition: opacity 240ms ease;
      }
      .hub__tile:hover .hub__tile-bg { opacity: 1; }

      /* Tile preview — visual aspect-ratio hint at the top */
      .hub__tile-preview {
        position: relative;
        display: block;
        padding: 24px 20px 0;
        min-height: 120px;
        display: grid;
        place-items: center;
      }
      .hub__tile-frame {
        display: block;
        border-radius: 6px;
        background: linear-gradient(135deg, var(--tile-a) 0%, var(--tile-b) 100%);
        box-shadow: 0 6px 20px -8px var(--tile-shadow, rgba(15, 23, 42, 0.25)),
          inset 0 0 0 1px rgba(255, 255, 255, 0.35);
      }
      /* Per-tile aspect-ratio frames — actual platform proportions, scaled */
      .hub__tile-frame[data-tile-id='ig-post']        { width: 68px; height: 68px; }
      .hub__tile-frame[data-tile-id='ig-story']       { width: 44px; height: 78px; }
      .hub__tile-frame[data-tile-id='linkedin-post']  { width: 92px; height: 48px; }
      .hub__tile-frame[data-tile-id='linkedin-banner']{ width: 106px; height: 27px; }
      .hub__tile-frame[data-tile-id='yt-thumb']       { width: 96px; height: 54px; }
      .hub__tile-frame[data-tile-id='logo']           { width: 60px; height: 60px; border-radius: 50%; }

      /* Per-tile color tokens */
      .hub__tile--ig-post         { --tile-a: rgba(124, 58, 237, 0.18); --tile-b: rgba(236, 72, 153, 0.60); --tile-shadow: rgba(168, 85, 247, 0.45); --tile-accent: #7c3aed; }
      .hub__tile--ig-story        { --tile-a: rgba(6, 182, 212, 0.18); --tile-b: rgba(16, 185, 129, 0.60); --tile-shadow: rgba(8, 145, 178, 0.45); --tile-accent: #06b6d4; }
      .hub__tile--linkedin-post   { --tile-a: rgba(59, 130, 246, 0.18); --tile-b: rgba(79, 70, 229, 0.60); --tile-shadow: rgba(37, 99, 235, 0.45); --tile-accent: #3b82f6; }
      .hub__tile--linkedin-banner { --tile-a: rgba(251, 191, 36, 0.20); --tile-b: rgba(249, 115, 22, 0.65); --tile-shadow: rgba(234, 88, 12, 0.40); --tile-accent: #f97316; }
      .hub__tile--yt-thumb        { --tile-a: rgba(244, 63, 94, 0.18); --tile-b: rgba(225, 29, 72, 0.60); --tile-shadow: rgba(190, 18, 60, 0.45); --tile-accent: #e11d48; }
      .hub__tile--logo            { --tile-a: rgba(16, 185, 129, 0.20); --tile-b: rgba(5, 150, 105, 0.65); --tile-shadow: rgba(5, 150, 105, 0.45); --tile-accent: #10b981; }

      .hub__tile-body {
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 14px;
        padding: 20px;
        border-top: 1px solid transparent;
      }

      .hub__tile-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--tile-a) 0%, var(--tile-b) 100%);
        color: #ffffff;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
        flex-shrink: 0;
      }
      .hub__tile-icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .hub__tile-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .hub__tile-label {
        font-size: 1.02rem;
        font-weight: 600;
        color: var(--px-ink);
        letter-spacing: -0.005em;
      }
      .hub__tile-subtitle {
        font-size: 0.82rem;
        color: var(--px-muted);
        font-feature-settings: 'tnum' 1;
      }

      .hub__tile-arrow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        color: var(--tile-accent, var(--px-violet));
        background: rgba(15, 23, 42, 0.04);
        opacity: 0;
        transform: translateX(-4px);
        transition: opacity 200ms ease, transform 200ms ease;
      }
      .hub__tile-arrow mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .hub__tile:hover .hub__tile-arrow {
        opacity: 1;
        transform: translateX(0);
      }

      /* ── Recent projects strip ───────────────────────────────────── */

      .hub__recent-strip {
        list-style: none;
        padding: 4px 4px 12px;
        margin: 0 -4px;
        display: flex;
        gap: 16px;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scrollbar-width: thin;
      }
      .hub__recent-strip::-webkit-scrollbar { height: 8px; }
      .hub__recent-strip::-webkit-scrollbar-thumb {
        background: var(--px-line);
        border-radius: 4px;
      }
      .hub__recent-item {
        flex: 0 0 auto;
        scroll-snap-align: start;
      }

      .hub__recent-tile {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 180px;
        padding: 10px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 14px;
        cursor: pointer;
        text-align: left;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }
      .hub__recent-tile:hover {
        transform: translateY(-2px);
        border-color: rgba(124, 58, 237, 0.4);
        box-shadow: 0 10px 24px -12px rgba(15, 23, 42, 0.2);
      }
      .hub__recent-tile:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }

      .hub__recent-thumb {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 10px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      }
      .hub__recent-thumb--placeholder {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--px-muted);
      }
      .hub__recent-thumb--placeholder mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .hub__recent-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--px-ink);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 4px 4px;
      }

      /* ── Empty state ─────────────────────────────────────────────── */

      .hub__recent-empty {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 28px 24px;
        background: var(--px-surface);
        border: 1px dashed var(--px-line);
        border-radius: 16px;
      }
      .hub__recent-empty-glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(6, 182, 212, 0.12));
        color: var(--px-violet);
        flex-shrink: 0;
      }
      .hub__recent-empty-glyph mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .hub__recent-empty-copy {
        margin: 0;
        color: var(--px-ink-soft);
        font-size: 0.95rem;
        line-height: 1.5;
      }

      @media (max-width: 580px) {
        .hub { padding: 40px 20px 56px; }
        .hub__header { align-items: stretch; }
        .hub__scratch { width: 100%; justify-content: center; }
        .hub__recent-tile { width: 148px; }
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
