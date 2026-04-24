import {
  Component,
  inject,
  signal,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CanvasService } from '../../../core/services/canvas.service';

interface Guide {
  id: number;
  orientation: 'horizontal' | 'vertical';
  position: number;
}

const RULER_SIZE = 24;
const TICK_COLOR = '#52525b';
const TEXT_COLOR = '#71717a';
const GUIDE_COLOR = '#06b6d4';

@Component({
  selector: 'app-canvas-rulers',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="rulers-container" [class.rulers-visible]="showRulers()">
      @if (showRulers()) {
        <!-- Corner -->
        <div class="ruler-corner" (click)="toggleRulers()" matTooltip="Hide rulers">
          <mat-icon class="corner-icon">straighten</mat-icon>
        </div>

        <!-- Horizontal ruler -->
        <div
          class="ruler ruler-horizontal"
          (mousedown)="startDragGuide($event, 'horizontal')"
        >
          <canvas #horizontalRuler></canvas>
        </div>

        <!-- Vertical ruler -->
        <div
          class="ruler ruler-vertical"
          (mousedown)="startDragGuide($event, 'vertical')"
        >
          <canvas #verticalRuler></canvas>
        </div>
      }

      <!-- Content area -->
      <div class="rulers-content">
        <ng-content></ng-content>
      </div>

      <!-- Guide lines overlay -->
      @for (guide of guides(); track guide.id) {
        <div
          class="guide-line"
          [class.horizontal]="guide.orientation === 'horizontal'"
          [class.vertical]="guide.orientation === 'vertical'"
          [style.top.px]="guide.orientation === 'horizontal' ? getGuideScreenPos(guide) : 0"
          [style.left.px]="guide.orientation === 'vertical' ? getGuideScreenPos(guide) : 0"
          (mousedown)="startMoveGuide($event, guide)"
          (dblclick)="removeGuide(guide.id)"
        >
          <span class="guide-label">{{ guide.position }}px</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }

    .rulers-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .rulers-container.rulers-visible .rulers-content {
      margin-left: ${RULER_SIZE}px;
      margin-top: ${RULER_SIZE}px;
      width: calc(100% - ${RULER_SIZE}px);
      height: calc(100% - ${RULER_SIZE}px);
    }

    .rulers-content {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .ruler-corner {
      position: absolute;
      top: 0;
      left: 0;
      width: ${RULER_SIZE}px;
      height: ${RULER_SIZE}px;
      background: #18181b;
      border-right: 1px solid #27272a;
      border-bottom: 1px solid #27272a;
      z-index: 10;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      .corner-icon {
        font-size: 14px;
        height: 14px;
        width: 14px;
        opacity: 0.4;
      }
    }

    .ruler {
      position: absolute;
      background: #18181b;
      z-index: 9;
      cursor: crosshair;
    }

    .ruler-horizontal {
      top: 0;
      left: ${RULER_SIZE}px;
      right: 0;
      height: ${RULER_SIZE}px;
      border-bottom: 1px solid #27272a;

      canvas {
        width: 100%;
        height: ${RULER_SIZE}px;
      }
    }

    .ruler-vertical {
      top: ${RULER_SIZE}px;
      left: 0;
      bottom: 0;
      width: ${RULER_SIZE}px;
      border-right: 1px solid #27272a;

      canvas {
        width: ${RULER_SIZE}px;
        height: 100%;
      }
    }

    .guide-line {
      position: absolute;
      z-index: 8;
      pointer-events: auto;

      &.horizontal {
        left: 0;
        right: 0;
        height: 1px;
        background: ${GUIDE_COLOR};
        cursor: ns-resize;
        padding: 3px 0;
        background-clip: content-box;

        .guide-label {
          position: absolute;
          left: ${RULER_SIZE + 4}px;
          top: 4px;
        }
      }

      &.vertical {
        top: 0;
        bottom: 0;
        width: 1px;
        background: ${GUIDE_COLOR};
        cursor: ew-resize;
        padding: 0 3px;
        background-clip: content-box;

        .guide-label {
          position: absolute;
          top: ${RULER_SIZE + 4}px;
          left: 8px;
        }
      }

      .guide-label {
        font-size: 10px;
        color: ${GUIDE_COLOR};
        white-space: nowrap;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.6);
        padding: 1px 4px;
        border-radius: 2px;
      }
    }
  `],
})
export class CanvasRulersComponent implements AfterViewInit, OnDestroy {
  private readonly canvasService = inject(CanvasService);

  @ViewChild('horizontalRuler') hRulerRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('verticalRuler') vRulerRef!: ElementRef<HTMLCanvasElement>;

  readonly showRulers = signal(true);
  readonly guides = signal<Guide[]>([]);

  private nextGuideId = 0;
  private resizeObserver!: ResizeObserver;
  private dragGuide: Guide | null = null;
  private isDraggingNew = false;
  private dragOrientation: 'horizontal' | 'vertical' = 'horizontal';

  private onMouseMoveBound = this.onMouseMove.bind(this);
  private onMouseUpBound = this.onMouseUp.bind(this);

  ngAfterViewInit(): void {
    this.drawRulers();

    this.resizeObserver = new ResizeObserver(() => this.drawRulers());

    if (this.hRulerRef?.nativeElement?.parentElement) {
      this.resizeObserver.observe(this.hRulerRef.nativeElement.parentElement);
    }
    if (this.vRulerRef?.nativeElement?.parentElement) {
      this.resizeObserver.observe(this.vRulerRef.nativeElement.parentElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    document.removeEventListener('mousemove', this.onMouseMoveBound);
    document.removeEventListener('mouseup', this.onMouseUpBound);
  }

  toggleRulers(): void {
    this.showRulers.update(v => !v);
    setTimeout(() => this.drawRulers(), 0);
  }

  getGuideScreenPos(guide: Guide): number {
    const zoom = this.canvasService.zoom();
    return RULER_SIZE + guide.position * zoom;
  }

  startDragGuide(event: MouseEvent, orientation: 'horizontal' | 'vertical'): void {
    event.preventDefault();
    this.isDraggingNew = true;
    this.dragOrientation = orientation;

    const guide: Guide = {
      id: this.nextGuideId++,
      orientation,
      position: 0,
    };
    this.dragGuide = guide;
    this.guides.update(g => [...g, guide]);

    document.addEventListener('mousemove', this.onMouseMoveBound);
    document.addEventListener('mouseup', this.onMouseUpBound);
  }

  startMoveGuide(event: MouseEvent, guide: Guide): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingNew = false;
    this.dragGuide = guide;

    document.addEventListener('mousemove', this.onMouseMoveBound);
    document.addEventListener('mouseup', this.onMouseUpBound);
  }

  removeGuide(id: number): void {
    this.guides.update(g => g.filter(guide => guide.id !== id));
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.dragGuide) return;

    const zoom = this.canvasService.zoom();
    const rect = (this.hRulerRef?.nativeElement?.parentElement?.parentElement)?.getBoundingClientRect();
    if (!rect) return;

    if (this.dragGuide.orientation === 'horizontal') {
      const y = event.clientY - rect.top - RULER_SIZE;
      this.dragGuide.position = Math.round(y / zoom);
    } else {
      const x = event.clientX - rect.left - RULER_SIZE;
      this.dragGuide.position = Math.round(x / zoom);
    }

    this.guides.update(g => [...g]);
  }

  private onMouseUp(): void {
    if (this.dragGuide && this.dragGuide.position < 0) {
      this.removeGuide(this.dragGuide.id);
    }
    this.dragGuide = null;
    document.removeEventListener('mousemove', this.onMouseMoveBound);
    document.removeEventListener('mouseup', this.onMouseUpBound);
  }

  private drawRulers(): void {
    if (!this.showRulers()) return;
    this.drawHorizontalRuler();
    this.drawVerticalRuler();
  }

  private drawHorizontalRuler(): void {
    const canvas = this.hRulerRef?.nativeElement;
    if (!canvas) return;

    const parent = canvas.parentElement!;
    const w = parent.clientWidth;
    const h = RULER_SIZE;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const zoom = this.canvasService.zoom();
    const step = this.getStep(zoom);

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    for (let px = 0; px < w; px++) {
      const canvasPx = Math.floor(px / zoom);

      if (canvasPx % step === 0) {
        const isMajor = canvasPx % (step * 5) === 0;
        ctx.strokeStyle = TICK_COLOR;
        ctx.beginPath();
        ctx.moveTo(px, isMajor ? 0 : h * 0.5);
        ctx.lineTo(px, h);
        ctx.stroke();

        if (isMajor) {
          ctx.fillText(String(canvasPx), px, 10);
        }
      }
    }
  }

  private drawVerticalRuler(): void {
    const canvas = this.vRulerRef?.nativeElement;
    if (!canvas) return;

    const parent = canvas.parentElement!;
    const w = RULER_SIZE;
    const h = parent.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const zoom = this.canvasService.zoom();
    const step = this.getStep(zoom);

    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '9px monospace';

    for (let py = 0; py < h; py++) {
      const canvasPy = Math.floor(py / zoom);

      if (canvasPy % step === 0) {
        const isMajor = canvasPy % (step * 5) === 0;
        ctx.strokeStyle = TICK_COLOR;
        ctx.beginPath();
        ctx.moveTo(isMajor ? 0 : w * 0.5, py);
        ctx.lineTo(w, py);
        ctx.stroke();

        if (isMajor) {
          ctx.save();
          ctx.translate(10, py);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.fillText(String(canvasPy), 0, 0);
          ctx.restore();
        }
      }
    }
  }

  private getStep(zoom: number): number {
    if (zoom >= 2) return 10;
    if (zoom >= 1) return 20;
    if (zoom >= 0.5) return 50;
    return 100;
  }
}
