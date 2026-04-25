import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { CanvasService } from '../../../core/services/canvas.service';
import { ApiService } from '../../../core/services/api.service';
import * as fabric from 'fabric';

interface FilterPreset {
  name: string;
  icon: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: boolean;
  sepia: boolean;
  hueRotation: number;
  noise: number;
  pixelate: number;
  invert: boolean;
}

@Component({
  selector: 'app-image-filters-panel',
  imports: [
    FormsModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    @if (isImageSelected()) {
      <div class="filters-panel">
        <div class="panel-header">
          <h3>Image Adjustments</h3>
          <button mat-button (click)="resetFilters()">Reset</button>
        </div>

        <!-- Replace & Crop -->
        <div class="crop-row">
          <button mat-stroked-button class="crop-btn" (click)="triggerReplace()">
            <mat-icon>swap_horiz</mat-icon> Replace
          </button>
          <input type="file" #replaceInput accept="image/*" (change)="onReplaceFile($event)" style="display: none" />
        </div>
        <div class="crop-row">
          @if (canvasService.isCropping()) {
            <button mat-flat-button class="crop-btn" (click)="canvasService.applyCrop()">
              <mat-icon>check</mat-icon> Apply Crop
            </button>
            <button mat-stroked-button class="crop-btn" (click)="canvasService.cancelCrop()">
              <mat-icon>close</mat-icon> Cancel
            </button>
          } @else {
            <button mat-stroked-button class="crop-btn" (click)="canvasService.startCrop()">
              <mat-icon>crop</mat-icon> Crop Image
            </button>
          }
        </div>

        <!-- Aspect ratio presets -->
        <div class="aspect-row">
          <span class="aspect-label">Ratio</span>
          @for (preset of aspectPresets; track preset.label) {
            <button
              class="aspect-chip"
              [class.active]="canvasService.cropAspectRatio() === preset.value"
              (click)="canvasService.setCropAspectRatio(preset.value)"
            >{{ preset.label }}</button>
          }
        </div>

        <mat-divider />

        <!-- Focal Blur -->
        <div class="filter-slider">
          <span class="slider-label">Focal Blur</span>
          <mat-slider min="0" max="20" step="1" class="slider">
            <input matSliderThumb [ngModel]="focalBlurAmount()" (ngModelChange)="focalBlurAmount.set($event)" />
          </mat-slider>
          <span class="slider-val">{{ focalBlurAmount() }}</span>
        </div>
        <div class="filter-slider">
          <span class="slider-label">Focus Size</span>
          <mat-slider min="50" max="500" step="10" class="slider">
            <input matSliderThumb [ngModel]="focalBlurRadius()" (ngModelChange)="focalBlurRadius.set($event)" />
          </mat-slider>
          <span class="slider-val">{{ focalBlurRadius() }}</span>
        </div>
        <div class="crop-row">
          <button mat-stroked-button class="crop-btn" (click)="applyFocalBlur()" [disabled]="focalBlurAmount() === 0">
            <mat-icon>lens_blur</mat-icon> Apply Focal Blur
          </button>
        </div>

        <mat-divider />

        <!-- Auto Enhance -->
        <div class="auto-enhance-row">
          <button mat-flat-button class="auto-enhance-btn" (click)="autoEnhance()">
            <mat-icon>auto_fix_high</mat-icon>
            Auto Enhance
          </button>
        </div>

        <!-- Quick Presets -->
        <div class="presets-row">
          @for (preset of presets; track preset.name) {
            <button class="preset-chip" (click)="applyPreset(preset)">
              {{ preset.name }}
            </button>
          }
        </div>

        <mat-divider />

        <!-- Sliders -->
        <div class="filter-slider">
          <span class="slider-label">Brightness</span>
          <mat-slider min="-100" max="100" step="1" class="slider">
            <input matSliderThumb [ngModel]="brightness()" (ngModelChange)="onBrightnessChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ brightness() }}</span>
        </div>

        <div class="filter-slider">
          <span class="slider-label">Contrast</span>
          <mat-slider min="-100" max="100" step="1" class="slider">
            <input matSliderThumb [ngModel]="contrast()" (ngModelChange)="onContrastChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ contrast() }}</span>
        </div>

        <div class="filter-slider">
          <span class="slider-label">Saturation</span>
          <mat-slider min="-100" max="100" step="1" class="slider">
            <input matSliderThumb [ngModel]="saturation()" (ngModelChange)="onSaturationChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ saturation() }}</span>
        </div>

        <div class="filter-slider">
          <span class="slider-label">Blur</span>
          <mat-slider min="0" max="20" step="0.5" class="slider">
            <input matSliderThumb [ngModel]="blurVal()" (ngModelChange)="onBlurChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ blurVal().toFixed(1) }}</span>
        </div>

        <div class="filter-slider">
          <span class="slider-label">Hue</span>
          <mat-slider min="-1" max="1" step="0.01" class="slider">
            <input matSliderThumb [ngModel]="hueRotation()" (ngModelChange)="onHueRotationChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ (hueRotation() * 180).toFixed(0) }}°</span>
        </div>

        <div class="filter-slider">
          <span class="slider-label">Noise</span>
          <mat-slider min="0" max="500" step="10" class="slider">
            <input matSliderThumb [ngModel]="noise()" (ngModelChange)="onNoiseChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ noise() }}</span>
        </div>

        <div class="filter-slider">
          <span class="slider-label">Pixelate</span>
          <mat-slider min="1" max="20" step="1" class="slider">
            <input matSliderThumb [ngModel]="pixelate()" (ngModelChange)="onPixelateChange($event)" />
          </mat-slider>
          <span class="slider-val">{{ pixelate() }}</span>
        </div>

        <mat-divider />

        <!-- Toggle filters -->
        <div class="toggle-row">
          <button
            mat-stroked-button
            [class.active]="grayscale()"
            (click)="toggleGrayscale()"
          >
            <mat-icon>filter_b_and_w</mat-icon>
            Grayscale
          </button>
          <button
            mat-stroked-button
            [class.active]="sepia()"
            (click)="toggleSepia()"
          >
            <mat-icon>filter_vintage</mat-icon>
            Sepia
          </button>
          <button
            mat-stroked-button
            [class.active]="invert()"
            (click)="toggleInvert()"
          >
            <mat-icon>invert_colors</mat-icon>
            Invert
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .filters-panel {
      border-bottom: 1px solid #27272a;
      padding-bottom: 8px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 4px;

      h3 {
        margin: 0;
        font-size: 0.82rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.6;
      }
    }

    .auto-enhance-row {
      padding: 4px 14px 8px;

      .auto-enhance-btn {
        width: 100%;
        background: linear-gradient(135deg, #7c3aed, #06b6d4) !important;
        color: white !important;
        height: 38px;
        font-size: 0.85rem;

        mat-icon {
          margin-right: 6px;
          font-size: 18px;
          height: 18px;
          width: 18px;
        }
      }
    }

    .crop-row {
      display: flex;
      gap: 8px;
      padding: 8px 14px;

      .crop-btn {
        flex: 1;
        font-size: 0.8rem;
      }
    }

    .aspect-row {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      padding: 4px 14px 8px;

      .aspect-label {
        font-size: 0.72rem;
        opacity: 0.5;
        margin-right: 2px;
      }

      .aspect-chip {
        padding: 3px 8px;
        background: var(--mat-sys-surface-container-high);
        border: 1px solid transparent;
        border-radius: 12px;
        color: inherit;
        font-size: 0.7rem;
        cursor: pointer;
        font-variant-numeric: tabular-nums;

        &.active {
          background: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);
          border-color: var(--mat-sys-primary);
        }

        &:not(.active):hover {
          border-color: var(--mat-sys-outline-variant);
        }
      }
    }

    .presets-row {
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      overflow-x: auto;
    }

    .preset-chip {
      padding: 6px 14px;
      border: 1px solid #3f3f46;
      border-radius: 16px;
      background: none;
      color: #d4d4d8;
      font-size: 0.75rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
        background: rgba(124, 58, 237, 0.1);
      }
    }

    .filter-slider {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 14px;

      .slider-label {
        font-size: 0.78rem;
        min-width: 72px;
        color: var(--px-ink-soft, #334155);
      }

      .slider {
        flex: 1;
      }

      .slider-val {
        font-size: 0.75rem;
        min-width: 32px;
        text-align: right;
        color: var(--px-muted, #64748b);
        font-variant-numeric: tabular-nums;
      }
    }

    .toggle-row {
      display: flex;
      gap: 8px;
      padding: 10px 14px;

      button {
        flex: 1;
        font-size: 0.78rem;

        &.active {
          background: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);
        }
      }
    }
  `],
})
export class ImageFiltersPanelComponent implements OnInit, OnDestroy {
  readonly canvasService = inject(CanvasService);
  private readonly apiService = inject(ApiService);
  @ViewChild('replaceInput') replaceInputRef!: ElementRef<HTMLInputElement>;

  readonly isImageSelected = signal(false);
  readonly brightness = signal(0);
  readonly contrast = signal(0);
  readonly saturation = signal(0);
  readonly blurVal = signal(0);
  readonly grayscale = signal(false);
  readonly sepia = signal(false);
  readonly hueRotation = signal(0);
  readonly noise = signal(0);
  readonly pixelate = signal(1);
  readonly invert = signal(false);

  readonly focalBlurAmount = signal(8);
  readonly focalBlurRadius = signal(150);

  async applyFocalBlur(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    const bound = obj.getBoundingRect();
    const cx = bound.left + bound.width / 2;
    const cy = bound.top + bound.height / 2;
    await this.canvasService.applyFocalBlur(cx, cy, this.focalBlurRadius(), this.focalBlurAmount());
  }

  readonly aspectPresets = [
    { label: 'Free', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4 / 3 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '3:2', value: 3 / 2 },
    { label: '2:3', value: 2 / 3 },
  ];

  readonly presets: FilterPreset[] = [
    { name: 'Original', icon: '', brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: false, sepia: false, hueRotation: 0, noise: 0, pixelate: 1, invert: false },
    { name: 'Vivid', icon: '', brightness: 10, contrast: 20, saturation: 40, blur: 0, grayscale: false, sepia: false, hueRotation: 0, noise: 0, pixelate: 1, invert: false },
    { name: 'Warm', icon: '', brightness: 5, contrast: 10, saturation: 20, blur: 0, grayscale: false, sepia: true, hueRotation: 0, noise: 0, pixelate: 1, invert: false },
    { name: 'Cool', icon: '', brightness: 0, contrast: 15, saturation: -20, blur: 0, grayscale: false, sepia: false, hueRotation: -0.1, noise: 0, pixelate: 1, invert: false },
    { name: 'B&W', icon: '', brightness: 0, contrast: 20, saturation: 0, blur: 0, grayscale: true, sepia: false, hueRotation: 0, noise: 0, pixelate: 1, invert: false },
    { name: 'Soft', icon: '', brightness: 10, contrast: -10, saturation: -10, blur: 1, grayscale: false, sepia: false, hueRotation: 0, noise: 0, pixelate: 1, invert: false },
    { name: 'Vintage', icon: '', brightness: -5, contrast: -10, saturation: -30, blur: 0, grayscale: false, sepia: true, hueRotation: 0, noise: 100, pixelate: 1, invert: false },
    { name: 'Dramatic', icon: '', brightness: -10, contrast: 40, saturation: 10, blur: 0, grayscale: false, sepia: false, hueRotation: 0, noise: 0, pixelate: 1, invert: false },
  ];

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

    const checkSelection = () => {
      const obj = canvas.getActiveObject();
      this.isImageSelected.set(obj instanceof fabric.FabricImage);
    };

    canvas.on('selection:created', checkSelection);
    canvas.on('selection:updated', checkSelection);
    canvas.on('selection:cleared', () => this.isImageSelected.set(false));

    this.canvasListeners = [
      () => canvas.off('selection:created', checkSelection),
      () => canvas.off('selection:updated', checkSelection),
      () => canvas.off('selection:cleared'),
    ];

    checkSelection();
  }

  ngOnDestroy(): void {
    this.canvasListeners.forEach(fn => fn());
  }

  applyPreset(preset: FilterPreset): void {
    this.brightness.set(preset.brightness);
    this.contrast.set(preset.contrast);
    this.saturation.set(preset.saturation);
    this.blurVal.set(preset.blur);
    this.grayscale.set(preset.grayscale);
    this.sepia.set(preset.sepia);
    this.hueRotation.set(preset.hueRotation);
    this.noise.set(preset.noise);
    this.pixelate.set(preset.pixelate);
    this.invert.set(preset.invert);
    this.applyFilters();
  }

  onBrightnessChange(val: number): void {
    this.brightness.set(val);
    this.applyFilters();
  }

  onContrastChange(val: number): void {
    this.contrast.set(val);
    this.applyFilters();
  }

  onSaturationChange(val: number): void {
    this.saturation.set(val);
    this.applyFilters();
  }

  onBlurChange(val: number): void {
    this.blurVal.set(val);
    this.applyFilters();
  }

  toggleGrayscale(): void {
    this.grayscale.set(!this.grayscale());
    this.applyFilters();
  }

  toggleSepia(): void {
    this.sepia.set(!this.sepia());
    this.applyFilters();
  }

  onHueRotationChange(val: number): void {
    this.hueRotation.set(val);
    this.applyFilters();
  }

  onNoiseChange(val: number): void {
    this.noise.set(val);
    this.applyFilters();
  }

  onPixelateChange(val: number): void {
    this.pixelate.set(val);
    this.applyFilters();
  }

  toggleInvert(): void {
    this.invert.set(!this.invert());
    this.applyFilters();
  }

  /**
   * Analyze the selected image's histogram and apply intelligent
   * brightness/contrast/saturation adjustments.
   */
  async autoEnhance(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    // Sample the image into a small temp canvas for histogram analysis
    const srcEl = obj.getElement() as HTMLImageElement | HTMLCanvasElement;
    if (!srcEl) return;

    const tmp = document.createElement('canvas');
    const sampleSize = 200;
    tmp.width = sampleSize;
    tmp.height = sampleSize;
    const ctx = tmp.getContext('2d')!;
    ctx.drawImage(srcEl as any, 0, 0, sampleSize, sampleSize);

    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

    // Compute mean luminance + min/max + saturation
    let totalLum = 0;
    let minLum = 255, maxLum = 0;
    let totalSat = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      totalLum += lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      totalSat += sat;
      count++;
    }

    const meanLum = totalLum / count;
    const meanSat = totalSat / count;
    const dynRange = maxLum - minLum;

    // Heuristics:
    // - Brightness: aim for mean around 128. If too dark/bright, nudge.
    let brightness = 0;
    if (meanLum < 100) brightness = Math.min(20, (100 - meanLum) / 4);
    else if (meanLum > 170) brightness = Math.max(-20, (170 - meanLum) / 4);

    // - Contrast: low dynamic range → boost contrast.
    let contrast = 0;
    if (dynRange < 180) contrast = Math.min(30, (180 - dynRange) / 5);

    // - Saturation: if washed out (low sat), boost it.
    let saturation = 0;
    if (meanSat < 0.3) saturation = Math.min(40, (0.3 - meanSat) * 100);

    this.brightness.set(Math.round(brightness));
    this.contrast.set(Math.round(contrast));
    this.saturation.set(Math.round(saturation));
    this.applyFilters();
  }

  triggerReplace(): void {
    this.replaceInputRef?.nativeElement?.click();
  }

  onReplaceFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    // PX-112 — upload to asset store first; canvas_json holds URL not base64.
    this.apiService.uploadAsset(file).subscribe({
      next: asset => {
        const url = this.apiService.getAssetUrl(asset.id);
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.onload = () => {
          const oldProps = {
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            opacity: obj.opacity,
            flipX: obj.flipX,
            flipY: obj.flipY,
            clipPath: obj.clipPath,
            originX: obj.originX,
            originY: obj.originY,
            filters: obj.filters,
          };

          const newImg = new fabric.FabricImage(imgEl);
          const oldWidth = (obj.width ?? 1) * (obj.scaleX ?? 1);
          const oldHeight = (obj.height ?? 1) * (obj.scaleY ?? 1);
          const newScaleX = oldWidth / (newImg.width ?? 1);
          const newScaleY = oldHeight / (newImg.height ?? 1);

          newImg.set({
            ...oldProps,
            scaleX: newScaleX,
            scaleY: newScaleY,
          } as any);
          (newImg as any).layerId = (obj as any).layerId;

          canvas!.remove(obj);
          canvas!.add(newImg);
          canvas!.setActiveObject(newImg);
          this.canvasService.commitChange(obj);
        };
        imgEl.src = url;
      },
      error: () => {/* swallow — host snackbar wiring not available here */},
    });
  }

  resetFilters(): void {
    this.brightness.set(0);
    this.contrast.set(0);
    this.saturation.set(0);
    this.blurVal.set(0);
    this.grayscale.set(false);
    this.sepia.set(false);
    this.hueRotation.set(0);
    this.noise.set(0);
    this.pixelate.set(1);
    this.invert.set(false);
    this.applyFilters();
  }

  private applyFilters(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    const filters: any[] = [];

    if (this.brightness() !== 0) {
      filters.push(new fabric.filters.Brightness({ brightness: this.brightness() / 100 }));
    }
    if (this.contrast() !== 0) {
      filters.push(new fabric.filters.Contrast({ contrast: this.contrast() / 100 }));
    }
    if (this.saturation() !== 0) {
      filters.push(new fabric.filters.Saturation({ saturation: this.saturation() / 100 }));
    }
    if (this.blurVal() > 0) {
      filters.push(new fabric.filters.Blur({ blur: this.blurVal() / 100 }));
    }
    if (this.grayscale()) {
      filters.push(new fabric.filters.Grayscale());
    }
    if (this.sepia()) {
      filters.push(new fabric.filters.Sepia());
    }
    if (this.hueRotation() !== 0) {
      filters.push(new fabric.filters.HueRotation({ rotation: this.hueRotation() }));
    }
    if (this.noise() > 0) {
      filters.push(new fabric.filters.Noise({ noise: this.noise() }));
    }
    if (this.pixelate() > 1) {
      filters.push(new fabric.filters.Pixelate({ blocksize: this.pixelate() }));
    }
    if (this.invert()) {
      filters.push(new fabric.filters.Invert());
    }

    obj.filters = filters;
    obj.applyFilters();
    this.canvasService.commitChange(obj);
  }
}
