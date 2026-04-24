import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CanvasService } from '../../../core/services/canvas.service';
import * as fabric from 'fabric';

interface GradientStop {
  offset: number;
  color: string;
}

interface GradientPreset {
  name: string;
  stops: GradientStop[];
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Sunset', stops: [{ offset: 0, color: '#ff6b35' }, { offset: 1, color: '#f7c59f' }] },
  { name: 'Ocean', stops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
  { name: 'Forest', stops: [{ offset: 0, color: '#11998e' }, { offset: 1, color: '#38ef7d' }] },
  { name: 'Fire', stops: [{ offset: 0, color: '#f12711' }, { offset: 0.5, color: '#f5af19' }, { offset: 1, color: '#f12711' }] },
  { name: 'Sky', stops: [{ offset: 0, color: '#a1c4fd' }, { offset: 1, color: '#c2e9fb' }] },
  { name: 'Night', stops: [{ offset: 0, color: '#0f0c29' }, { offset: 0.5, color: '#302b63' }, { offset: 1, color: '#24243e' }] },
  { name: 'Rose', stops: [{ offset: 0, color: '#ee9ca7' }, { offset: 1, color: '#ffdde1' }] },
  { name: 'Peach', stops: [{ offset: 0, color: '#ffecd2' }, { offset: 1, color: '#fcb69f' }] },
  { name: 'Aqua', stops: [{ offset: 0, color: '#00cdac' }, { offset: 1, color: '#02aab0' }] },
  { name: 'Berry', stops: [{ offset: 0, color: '#6a3093' }, { offset: 1, color: '#a044ff' }] },
  { name: 'Gold', stops: [{ offset: 0, color: '#f2994a' }, { offset: 1, color: '#f2c94c' }] },
  { name: 'Ice', stops: [{ offset: 0, color: '#e0eafc' }, { offset: 1, color: '#cfdef3' }] },
];

@Component({
  selector: 'app-gradient-panel',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="gradient-panel">
      <!-- Fill type toggle -->
      <div class="fill-type">
        <mat-button-toggle-group [ngModel]="fillType()" (ngModelChange)="setFillType($event)">
          <mat-button-toggle value="solid" matTooltip="Solid Color">
            <mat-icon>format_color_fill</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="linear" matTooltip="Linear Gradient">
            <mat-icon>gradient</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="radial" matTooltip="Radial Gradient">
            <mat-icon>blur_circular</mat-icon>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      @if (fillType() === 'solid') {
        <div class="color-row">
          <label>Fill</label>
          <input type="color" [ngModel]="solidColor()" (ngModelChange)="applySolidColor($event)" class="color-input" />
          <input class="hex-text" [ngModel]="solidColor()" (ngModelChange)="applySolidColor($event)" />
          <button
            mat-icon-button
            class="eyedropper-btn"
            [class.active]="canvasService.isEyedropper()"
            matTooltip="Pick color from canvas"
            (click)="startEyedropper()"
          >
            <mat-icon>colorize</mat-icon>
          </button>
        </div>
      } @else {
        <!-- Gradient angle (linear only) -->
        @if (fillType() === 'linear') {
          <div class="slider-row">
            <span>Angle</span>
            <mat-slider min="0" max="360" step="1" class="flex-slider">
              <input matSliderThumb [ngModel]="angle()" (ngModelChange)="setAngle($event)" />
            </mat-slider>
            <span class="slider-value">{{ angle() }}°</span>
          </div>
        }

        <!-- Color stops -->
        <div class="stops-section">
          <span class="section-label">Color Stops</span>
          @for (stop of stops(); track $index) {
            <div class="stop-row">
              <input type="color" [ngModel]="stop.color" (ngModelChange)="updateStopColor($index, $event)" class="color-input" />
              <mat-slider min="0" max="100" step="1" class="flex-slider">
                <input matSliderThumb [ngModel]="stop.offset * 100" (ngModelChange)="updateStopOffset($index, $event / 100)" />
              </mat-slider>
              <span class="slider-value">{{ (stop.offset * 100).toFixed(0) }}%</span>
              @if (stops().length > 2) {
                <button mat-icon-button class="remove-stop" (click)="removeStop($index)" matTooltip="Remove stop">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>
          }
          <button mat-stroked-button class="add-stop-btn" (click)="addStop()">
            <mat-icon>add</mat-icon> Add Stop
          </button>
        </div>

        <!-- Presets -->
        <div class="presets-section">
          <span class="section-label">Presets</span>
          <div class="presets-grid">
            @for (preset of presets; track preset.name) {
              <button
                class="preset-swatch"
                [style.background]="getPresetGradientCSS(preset)"
                [matTooltip]="preset.name"
                (click)="applyPreset(preset)"
              ></button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gradient-panel {
      padding: 8px 0;
    }

    .fill-type {
      margin-bottom: 12px;

      mat-button-toggle-group {
        width: 100%;
      }
    }

    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      label {
        font-size: 0.85rem;
        min-width: 30px;
      }

      .color-input {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        padding: 0;
        background: none;
      }

      .hex-text {
        flex: 1;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 4px;
        padding: 6px 8px;
        color: inherit;
        font-size: 0.85rem;
      }
    }

    .eyedropper-btn {
      transform: scale(0.85);

      &.active {
        color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;

      span:first-child {
        font-size: 0.85rem;
        min-width: 40px;
      }

      .flex-slider {
        flex: 1;
      }

      .slider-value {
        font-size: 0.8rem;
        min-width: 36px;
        text-align: right;
        opacity: 0.7;
      }
    }

    .stops-section {
      margin-top: 8px;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.5;
      display: block;
      margin-bottom: 8px;
    }

    .stop-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;

      .color-input {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        padding: 0;
        background: none;
        flex-shrink: 0;
      }

      .flex-slider {
        flex: 1;
      }

      .slider-value {
        font-size: 0.8rem;
        min-width: 32px;
        text-align: right;
        opacity: 0.7;
      }

      .remove-stop {
        transform: scale(0.7);
        opacity: 0.5;

        &:hover {
          opacity: 1;
        }
      }
    }

    .add-stop-btn {
      width: 100%;
      margin-top: 8px;
      font-size: 0.8rem;
    }

    .presets-section {
      margin-top: 16px;
    }

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .preset-swatch {
      width: 100%;
      aspect-ratio: 1.5;
      border-radius: 6px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;

      &:hover {
        transform: scale(1.1);
        border-color: var(--mat-sys-primary);
      }
    }
  `],
})
export class GradientPanelComponent implements OnInit, OnDestroy {
  readonly canvasService = inject(CanvasService);

  readonly fillType = signal<'solid' | 'linear' | 'radial'>('solid');
  readonly solidColor = signal('#4285f4');
  readonly angle = signal(0);
  readonly stops = signal<GradientStop[]>([
    { offset: 0, color: '#667eea' },
    { offset: 1, color: '#764ba2' },
  ]);

  readonly presets = GRADIENT_PRESETS;

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

    const onSelect = () => this.readFill();
    canvas.on('selection:created', onSelect);
    canvas.on('selection:updated', onSelect);
    canvas.on('selection:cleared', () => this.fillType.set('solid'));

    this.canvasListeners = [
      () => canvas.off('selection:created', onSelect),
      () => canvas.off('selection:updated', onSelect),
      () => canvas.off('selection:cleared', () => {}),
    ];

    onSelect();
  }

  ngOnDestroy(): void {
    this.canvasListeners.forEach(fn => fn());
  }

  setFillType(type: 'solid' | 'linear' | 'radial'): void {
    this.fillType.set(type);

    if (type === 'solid') {
      this.applySolidColor(this.solidColor());
    } else {
      this.applyGradient();
    }
  }

  applySolidColor(color: string): void {
    if (!color) return;
    this.solidColor.set(color);

    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.set('fill', color);
    this.canvasService.commitChange(obj);
  }

  startEyedropper(): void {
    this.canvasService.startEyedropper((color) => {
      this.applySolidColor(color);
    });
  }

  setAngle(deg: number): void {
    this.angle.set(deg);
    this.applyGradient();
  }

  updateStopColor(index: number, color: string): void {
    this.stops.update(stops => stops.map((s, i) => i === index ? { ...s, color } : s));
    this.applyGradient();
  }

  updateStopOffset(index: number, offset: number): void {
    this.stops.update(stops => stops.map((s, i) => i === index ? { ...s, offset } : s));
    this.applyGradient();
  }

  addStop(): void {
    const current = this.stops();
    const lastColor = current[current.length - 1]?.color ?? '#ffffff';
    this.stops.update(stops => [...stops, { offset: 1, color: lastColor }]);
    this.applyGradient();
  }

  removeStop(index: number): void {
    if (this.stops().length <= 2) return;
    this.stops.update(stops => stops.filter((_, i) => i !== index));
    this.applyGradient();
  }

  applyPreset(preset: GradientPreset): void {
    this.stops.set([...preset.stops]);
    this.applyGradient();
  }

  getPresetGradientCSS(preset: GradientPreset): string {
    const stops = preset.stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ');
    return `linear-gradient(90deg, ${stops})`;
  }

  private applyGradient(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    const colorStops = this.stops().map(s => ({
      offset: s.offset,
      color: s.color,
    }));

    const type = this.fillType();
    if (type === 'solid') return;

    let coords: any;
    if (type === 'linear') {
      const rad = (this.angle() * Math.PI) / 180;
      const w = obj.width ?? 100;
      const h = obj.height ?? 100;
      coords = {
        x1: w / 2 - (Math.cos(rad) * w) / 2,
        y1: h / 2 - (Math.sin(rad) * h) / 2,
        x2: w / 2 + (Math.cos(rad) * w) / 2,
        y2: h / 2 + (Math.sin(rad) * h) / 2,
      };
    } else {
      const w = obj.width ?? 100;
      const h = obj.height ?? 100;
      const r = Math.max(w, h) / 2;
      coords = {
        x1: w / 2,
        y1: h / 2,
        x2: w / 2,
        y2: h / 2,
        r1: 0,
        r2: r,
      };
    }

    const gradient = new fabric.Gradient({
      type: type === 'linear' ? 'linear' : 'radial',
      coords,
      colorStops,
    });

    obj.set('fill', gradient);
    this.canvasService.commitChange(obj);
  }

  private readFill(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    const fill = obj.fill;

    if (typeof fill === 'string') {
      this.fillType.set('solid');
      this.solidColor.set(fill || '#000000');
    } else if (fill && typeof fill === 'object' && 'type' in fill) {
      const grad = fill as fabric.Gradient<'linear' | 'radial'>;
      this.fillType.set(grad.type === 'radial' ? 'radial' : 'linear');

      if (grad.colorStops) {
        this.stops.set(grad.colorStops.map((cs: any) => ({
          offset: cs.offset ?? 0,
          color: cs.color ?? '#000000',
        })));
      }

      if (grad.type === 'linear' && grad.coords) {
        const c = grad.coords as any;
        const dx = (c.x2 ?? 0) - (c.x1 ?? 0);
        const dy = (c.y2 ?? 0) - (c.y1 ?? 0);
        this.angle.set(Math.round((Math.atan2(dy, dx) * 180) / Math.PI));
      }
    }
  }
}
