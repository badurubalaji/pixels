import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CanvasService } from '../../../core/services/canvas.service';
import { AnimationService, ObjectAnimation, ANIMATION_PRESETS } from '../../../core/services/animation.service';
import * as fabric from 'fabric';

interface TimelineRow {
  layerId: string;
  name: string;
  type: 'image' | 'text' | 'shape';
  animation: ObjectAnimation | null;
  obj: fabric.FabricObject;
}

const TIMELINE_END_MS = 4000;
const PIXELS_PER_MS = 0.18;

@Component({
  selector: 'app-animation-timeline',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (visible()) {
      <div class="timeline-container">
        <div class="timeline-header">
          <button mat-icon-button (click)="visible.set(false)" matTooltip="Hide timeline">
            <mat-icon>close</mat-icon>
          </button>
          <strong>Timeline</strong>
          <button mat-flat-button class="play-btn" (click)="playAll()">
            <mat-icon>play_arrow</mat-icon> Preview
          </button>
          <span class="timeline-spacer"></span>
          <span class="timeline-info">{{ rows().length }} layer{{ rows().length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Time ruler -->
        <div class="time-ruler">
          @for (tick of timeTicks; track tick) {
            <div class="time-tick" [style.left.px]="msToPixels(tick)">
              <span>{{ tick }}ms</span>
            </div>
          }
        </div>

        <!-- Rows -->
        <div class="timeline-rows">
          @for (row of rows(); track row.layerId) {
            <div class="timeline-row" [class.selected]="row.layerId === canvasService.activeLayerId()"
              (click)="canvasService.selectLayer(row.layerId)">
              <div class="row-label">
                <mat-icon class="row-icon">
                  @switch (row.type) {
                    @case ('image') { image }
                    @case ('text') { title }
                    @default { category }
                  }
                </mat-icon>
                <span class="row-name">{{ row.name }}</span>
              </div>

              <div class="row-track">
                @if (row.animation && row.animation.type !== 'none') {
                  <div class="track-bar"
                    [style.left.px]="msToPixels(row.animation.delay)"
                    [style.width.px]="Math.max(40, msToPixels(row.animation.duration))"
                    [matTooltip]="getAnimLabel(row.animation.type) + ' · ' + row.animation.duration + 'ms · delay ' + row.animation.delay + 'ms'">
                    <span class="bar-label">
                      <mat-icon>{{ getAnimIcon(row.animation.type) }}</mat-icon>
                      {{ getAnimLabel(row.animation.type) }}
                    </span>
                  </div>
                } @else {
                  <div class="track-empty" (click)="quickAddAnim($event, row)">
                    <mat-icon>add</mat-icon> Add animation
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="timeline-empty">No layers yet — add elements to the canvas first</div>
          }
        </div>
      </div>
    }

    <button mat-icon-button class="timeline-toggle" [class.active]="visible()"
      [matTooltip]="visible() ? 'Hide timeline' : 'Show timeline'"
      (click)="visible.update(v => !v)">
      <mat-icon>view_timeline</mat-icon>
    </button>
  `,
  styles: [`
    .timeline-toggle {
      position: fixed;
      bottom: 80px;
      right: 16px;
      z-index: 90;
      background: var(--mat-sys-surface-container-high) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

      &.active {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
      }
    }

    .timeline-container {
      position: fixed;
      bottom: 0;
      left: 76px;
      right: 320px;
      height: 220px;
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
      z-index: 80;
      display: flex;
      flex-direction: column;

      @media (max-width: 768px) {
        left: 0;
        right: 0;
        bottom: 56px;
      }
    }

    .timeline-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      strong { font-size: 0.92rem; }
      .play-btn {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
      }
      .timeline-spacer { flex: 1; }
      .timeline-info { font-size: 0.78rem; opacity: 0.55; }
    }

    .time-ruler {
      position: relative;
      height: 24px;
      padding-left: 200px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-high);
    }

    .time-tick {
      position: absolute;
      top: 0;
      bottom: 0;
      border-left: 1px solid var(--mat-sys-outline-variant);
      padding-left: 4px;
      font-size: 0.68rem;
      color: var(--mat-sys-on-surface);
      opacity: 0.55;
      font-variant-numeric: tabular-nums;
      transform: translateX(200px);
    }

    .timeline-rows {
      flex: 1;
      overflow-y: auto;
    }

    .timeline-row {
      display: flex;
      align-items: center;
      height: 36px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--mat-sys-surface-container-high);
      }

      &.selected {
        background: rgba(124, 58, 237, 0.1);
      }
    }

    .row-label {
      width: 200px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      flex-shrink: 0;

      .row-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
        opacity: 0.55;
      }

      .row-name {
        font-size: 0.82rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .row-track {
      flex: 1;
      position: relative;
      height: 100%;
    }

    .track-bar {
      position: absolute;
      top: 6px;
      bottom: 6px;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      cursor: grab;
      transition: filter 0.15s;

      &:hover { filter: brightness(1.15); }
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 4px;
      color: white;
      font-size: 0.72rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;

      mat-icon {
        font-size: 14px;
        height: 14px;
        width: 14px;
      }
    }

    .track-empty {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 100%;
      font-size: 0.74rem;
      opacity: 0.4;
      cursor: pointer;

      &:hover { opacity: 0.7; }

      mat-icon { font-size: 14px; height: 14px; width: 14px; }
    }

    .timeline-empty {
      padding: 24px;
      text-align: center;
      opacity: 0.4;
      font-size: 0.85rem;
    }
  `],
})
export class AnimationTimeline implements OnInit, OnDestroy {
  readonly canvasService = inject(CanvasService);
  private readonly animationService = inject(AnimationService);

  readonly visible = signal(false);
  readonly Math = Math;

  readonly timeTicks = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];

  private refreshSignal = signal(0);

  readonly rows = computed<TimelineRow[]>(() => {
    this.refreshSignal();
    const layers = this.canvasService.layers();
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return [];

    const result: TimelineRow[] = [];
    for (const layer of layers) {
      const obj = canvas.getObjects().find(o => (o as any).layerId === layer.id);
      if (!obj) continue;
      result.push({
        layerId: layer.id,
        name: layer.name,
        type: layer.type as 'image' | 'text' | 'shape',
        animation: this.animationService.getAnimation(obj),
        obj,
      });
    }
    return result;
  });

  private canvasListeners: (() => void)[] = [];

  ngOnInit(): void {
    this.attachWhenReady();
  }

  private attachWhenReady(attempts = 0): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      if (attempts > 50) return;
      setTimeout(() => this.attachWhenReady(attempts + 1), 100);
      return;
    }

    const refresh = () => this.refreshSignal.update(v => v + 1);
    canvas.on('object:modified', refresh);
    canvas.on('object:added', refresh);
    canvas.on('object:removed', refresh);

    this.canvasListeners = [
      () => canvas.off('object:modified', refresh),
      () => canvas.off('object:added', refresh),
      () => canvas.off('object:removed', refresh),
    ];
    refresh();
  }

  ngOnDestroy(): void {
    this.canvasListeners.forEach(fn => fn());
  }

  msToPixels(ms: number): number {
    return ms * PIXELS_PER_MS;
  }

  getAnimLabel(type: string): string {
    return ANIMATION_PRESETS.find(p => p.type === type)?.label ?? type;
  }

  getAnimIcon(type: string): string {
    return ANIMATION_PRESETS.find(p => p.type === type)?.icon ?? 'play_arrow';
  }

  quickAddAnim(event: Event, row: TimelineRow): void {
    event.stopPropagation();
    // Default to fade-in
    this.animationService.setAnimation(row.obj, {
      type: 'fade-in',
      duration: 600,
      delay: 0,
    });
    this.refreshSignal.update(v => v + 1);
  }

  async playAll(): Promise<void> {
    await this.animationService.playAll();
  }
}
