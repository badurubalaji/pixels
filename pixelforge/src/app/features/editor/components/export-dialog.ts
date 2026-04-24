import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CanvasService } from '../../../core/services/canvas.service';
import { ExportService } from '../../../core/services/export.service';
import { ProjectService } from '../../../core/services/project.service';
import { PLATFORM_PRESETS } from '../../../core/constants/platform-presets';

export interface ExportDialogData {
  getPages?: () => { canvasJson: string }[];
  getCurrentPageJson?: () => string;
}

type ExportFormat = 'png' | 'svg' | 'webp' | 'jpeg' | 'pdf' | 'gif' | 'video' | 'batch';

interface BatchSize {
  name: string;
  width: number;
  height: number;
}

/**
 * Batch-export size list, sourced from the canonical platform-preset
 * constants (Story PX-020 AC-1, AC-4). The `custom` sentinel preset is
 * filtered out — 0x0 is not a valid batch target. Any future size additions
 * must happen in `core/constants/platform-presets.ts` (and its BE mirror),
 * **not** re-added inline here.
 */
const BATCH_SIZE_PRESETS: BatchSize[] = PLATFORM_PRESETS
  .filter((p) => p.id !== 'custom' && p.width > 0 && p.height > 0)
  .map((p) => ({ name: p.label, width: p.width, height: p.height }));

@Component({
  selector: 'app-export-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
  ],
  template: `
    <div class="export-dialog">
      <div class="dialog-header">
        <h2>Download your design</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        <!-- File Name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>File name</mat-label>
          <input matInput [(ngModel)]="fileName" />
        </mat-form-field>

        <!-- Platform presets (quick exports) -->
        <div class="label">Quick Export Preset</div>
        <div class="platform-presets">
          @for (preset of platformPresets; track preset.name) {
            <button class="platform-preset" (click)="applyPlatformPreset(preset)"
              [class.active]="activePlatformPreset() === preset.name">
              <mat-icon>{{ preset.icon }}</mat-icon>
              <span>{{ preset.name }}</span>
            </button>
          }
        </div>

        <!-- Format -->
        <div class="label">File type</div>
        <div class="format-row">
          @for (fmt of formats; track fmt.value) {
            <button
              class="format-btn"
              [class.active]="selectedFormat() === fmt.value"
              (click)="selectedFormat.set(fmt.value)"
            >
              <mat-icon>{{ fmt.icon }}</mat-icon>
              <span class="fmt-label">{{ fmt.label }}</span>
            </button>
          }
        </div>

        @if (selectedFormat() === 'pdf' && totalPages() > 1) {
          <div class="label">Pages</div>
          <mat-button-toggle-group [ngModel]="pdfPageRange()" (ngModelChange)="pdfPageRange.set($event)">
            <mat-button-toggle value="current">Current Page</mat-button-toggle>
            <mat-button-toggle value="all">All {{ totalPages() }} Pages</mat-button-toggle>
          </mat-button-toggle-group>
        }

        @if (selectedFormat() === 'batch') {
          <div class="label">Select sizes to export</div>
          <div class="batch-list">
            @for (size of batchSizePresets; track size.name) {
              <label class="batch-item">
                <input type="checkbox"
                  [checked]="selectedBatchSizes().has(size.name)"
                  (change)="toggleBatchSize(size.name)" />
                <div class="batch-info">
                  <strong>{{ size.name }}</strong>
                  <span>{{ size.width }} × {{ size.height }}</span>
                </div>
              </label>
            }
          </div>
          <p style="font-size: 0.78rem; opacity: 0.6; margin: 8px 0 0;">
            {{ selectedBatchSizes().size }} size{{ selectedBatchSizes().size !== 1 ? 's' : '' }} selected · packaged as ZIP
          </p>
        }

        @if (selectedFormat() === 'video') {
          <div class="label">Duration ({{ videoDuration() }}s)</div>
          <mat-slider min="2" max="20" step="1" style="width:100%">
            <input matSliderThumb [ngModel]="videoDuration()" (ngModelChange)="videoDuration.set($event)" />
          </mat-slider>
          <p style="font-size: 0.78rem; opacity: 0.6; margin: 4px 0 0;">
            Animated objects will play their enter animations during the recording.
          </p>
        }

        @if (selectedFormat() === 'gif') {
          <div class="label">Frame Duration ({{ gifFrameDelay() }}ms)</div>
          <mat-slider min="100" max="3000" step="100" style="width:100%">
            <input matSliderThumb [ngModel]="gifFrameDelay()" (ngModelChange)="gifFrameDelay.set($event)" />
          </mat-slider>
          <p style="font-size: 0.78rem; opacity: 0.6; margin: 4px 0 0;">
            @if (totalPages() > 1) {
              GIF will cycle through all {{ totalPages() }} pages
            } @else {
              Add multiple pages to create animated GIF frames
            }
          </p>
        }

        <!-- Background toggle — BIG and obvious -->
        <div class="bg-section">
          <div class="bg-toggle-card" [class.transparent]="transparentBg()">
            <div class="bg-preview" [class.checkerboard]="transparentBg()">
              <span class="preview-text">Aa</span>
            </div>
            <div class="bg-info">
              <strong>Transparent background</strong>
              <span class="bg-desc">
                {{ transparentBg() ? 'Background will be removed from export' : 'Export includes the canvas background' }}
              </span>
            </div>
            <mat-slide-toggle
              [ngModel]="transparentBg()"
              (ngModelChange)="transparentBg.set($event)"
              [disabled]="selectedFormat() === 'jpeg'"
            />
          </div>
          @if (selectedFormat() === 'jpeg') {
            <span class="jpeg-note">JPEG does not support transparency</span>
          }
        </div>

        <mat-divider />

        <!-- Resolution -->
        <div class="label">Resolution</div>
        <div class="res-row">
          @for (res of resolutions; track res.label) {
            <button
              class="res-btn"
              [class.active]="selectedRes() === res"
              (click)="selectedRes.set(res)"
            >
              {{ res.label }}
              @if (res.tag) {
                <span class="res-tag">{{ res.tag }}</span>
              }
            </button>
          }
        </div>
        <div class="dimensions">
          {{ outputWidth() }} × {{ outputHeight() }} px
        </div>

        <!-- Quality -->
        @if (selectedFormat() === 'jpeg' || selectedFormat() === 'webp') {
          <div class="label">Quality</div>
          <div class="quality-row">
            <mat-slider min="10" max="100" step="5" class="q-slider">
              <input matSliderThumb [(ngModel)]="quality" />
            </mat-slider>
            <span class="q-val">{{ quality }}%</span>
          </div>
        }
      </div>

      <div class="dialog-footer">
        <button mat-button (click)="close()">Cancel</button>
        <button mat-flat-button class="download-btn" (click)="doExport()">
          <mat-icon>download</mat-icon>
          Download
        </button>
      </div>
    </div>
  `,
  styles: [`
    .export-dialog {
      width: 480px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 12px;
      h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    }

    .dialog-body {
      padding: 8px 24px 16px;
    }

    .full-width { width: 100%; }

    .label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      opacity: 0.5;
      margin: 18px 0 10px;
    }

    .platform-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 4px;
    }

    .platform-preset {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
      color: inherit;
      cursor: pointer;
      font-size: 0.76rem;
      transition: all 0.15s;

      mat-icon { font-size: 14px; height: 14px; width: 14px; }

      &:hover { border-color: var(--mat-sys-primary); }

      &.active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        border-color: var(--mat-sys-primary);
      }
    }

    /* Formats */
    .format-row {
      display: flex;
      gap: 8px;
    }

    .format-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px 8px;
      border: 2px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      background: none;
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      transition: all 0.15s;

      mat-icon { font-size: 22px; height: 22px; width: 22px; opacity: 0.6; }
      .fmt-label { font-size: 0.8rem; font-weight: 600; }

      &:hover { border-color: var(--mat-sys-primary); }
      &.active {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        mat-icon { opacity: 1; }
      }
    }

    /* Background toggle */
    .bg-section {
      margin: 18px 0 12px;
    }

    .bg-toggle-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: 2px solid var(--mat-sys-outline-variant);
      border-radius: 14px;
      transition: border-color 0.2s;

      &.transparent {
        border-color: var(--mat-sys-primary);
      }
    }

    .bg-preview {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s;

      &.checkerboard {
        background-color: #e0e0e0;
        background-image:
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%);
        background-size: 12px 12px;
        background-position: 0 0, 0 6px, 6px -6px, -6px 0;
      }

      .preview-text {
        font-size: 1.2rem;
        font-weight: 700;
        color: #333;
      }
    }

    .bg-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong { font-size: 0.9rem; }
      .bg-desc { font-size: 0.75rem; opacity: 0.5; }
    }

    .jpeg-note {
      font-size: 0.75rem;
      opacity: 0.5;
      margin-top: 6px;
      display: block;
    }

    /* Resolution */
    .res-row {
      display: flex;
      gap: 8px;
    }

    .res-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      border: 2px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      background: none;
      color: var(--mat-sys-on-surface);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.15s;

      &:hover { border-color: var(--mat-sys-primary); }
      &.active {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }

      .res-tag {
        font-size: 0.6rem;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 4px;
        background: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
      }
    }

    .dimensions {
      text-align: center;
      font-size: 0.82rem;
      opacity: 0.5;
      margin-top: 8px;
      font-variant-numeric: tabular-nums;
    }

    /* Quality */
    .quality-row {
      display: flex;
      align-items: center;
      gap: 12px;
      .q-slider { flex: 1; }
      .q-val { font-size: 0.85rem; min-width: 38px; text-align: right; }
    }

    .batch-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 240px;
      overflow-y: auto;
    }

    .batch-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: var(--mat-sys-surface-container-highest); }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--mat-sys-primary);
      }

      .batch-info {
        display: flex;
        flex-direction: column;
        gap: 1px;

        strong { font-size: 0.85rem; }
        span { font-size: 0.72rem; opacity: 0.55; font-variant-numeric: tabular-nums; }
      }
    }

    /* Footer */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 24px 20px;
    }

    .download-btn {
      padding: 8px 28px;
      font-size: 0.95rem;
    }
  `],
})
export class ExportDialog {
  private readonly canvasService = inject(CanvasService);
  private readonly exportService = inject(ExportService);
  private readonly projectService = inject(ProjectService);
  private readonly dialogRef = inject(MatDialogRef<ExportDialog>);

  fileName = this.projectService.currentProject()?.name ?? 'design';
  quality = 90;

  readonly transparentBg = signal(true);
  readonly selectedFormat = signal<ExportFormat>('png');
  readonly pdfPageRange = signal<'current' | 'all'>('current');
  readonly gifFrameDelay = signal(800);
  readonly videoDuration = signal(5);
  readonly pagesData = signal<{ canvasJson: string }[]>([]);
  readonly currentPageJson = signal<string>('');

  readonly totalPages = computed(() => this.pagesData().length);

  readonly selectedRes = signal({ label: '1x', multiplier: 1, tag: '' });

  readonly formats = [
    { value: 'png' as ExportFormat, label: 'PNG', icon: 'image' },
    { value: 'svg' as ExportFormat, label: 'SVG', icon: 'code' },
    { value: 'webp' as ExportFormat, label: 'WebP', icon: 'web' },
    { value: 'jpeg' as ExportFormat, label: 'JPG', icon: 'photo' },
    { value: 'pdf' as ExportFormat, label: 'PDF', icon: 'picture_as_pdf' },
    { value: 'gif' as ExportFormat, label: 'GIF', icon: 'gif_box' },
    { value: 'video' as ExportFormat, label: 'Video', icon: 'movie' },
    { value: 'batch' as ExportFormat, label: 'Batch', icon: 'view_quilt' },
  ];

  readonly batchSizePresets = BATCH_SIZE_PRESETS;

  readonly platformPresets = [
    { name: 'Instagram', icon: 'camera_alt', format: 'jpeg' as ExportFormat, quality: 92, multiplier: 1, transparent: false },
    { name: 'Twitter',   icon: 'chat_bubble', format: 'png'  as ExportFormat, quality: 100, multiplier: 1, transparent: false },
    { name: 'Facebook',  icon: 'thumb_up',    format: 'jpeg' as ExportFormat, quality: 85, multiplier: 1, transparent: false },
    { name: 'LinkedIn',  icon: 'work',        format: 'png'  as ExportFormat, quality: 100, multiplier: 1, transparent: false },
    { name: 'Email',     icon: 'mail',        format: 'jpeg' as ExportFormat, quality: 80, multiplier: 0.6, transparent: false },
    { name: 'Print HD',  icon: 'print',       format: 'pdf'  as ExportFormat, quality: 100, multiplier: 2, transparent: false },
    { name: 'Web (Transparent)', icon: 'web', format: 'png' as ExportFormat, quality: 100, multiplier: 1, transparent: true },
  ];

  readonly activePlatformPreset = signal<string | null>(null);

  applyPlatformPreset(preset: typeof this.platformPresets[0]): void {
    this.selectedFormat.set(preset.format);
    this.quality = preset.quality;
    this.transparentBg.set(preset.transparent);
    // Find closest-matching resolution
    const match = this.resolutions.find(r => Math.abs(r.multiplier - preset.multiplier) < 0.3);
    if (match) this.selectedRes.set(match);
    this.activePlatformPreset.set(preset.name);
  }
  readonly selectedBatchSizes = signal<Set<string>>(new Set(['Instagram Post', 'LinkedIn Post', 'YouTube Thumbnail']));

  readonly resolutions = [
    { label: '1x', multiplier: 1, tag: '' },
    { label: '2x', multiplier: 2, tag: '' },
    { label: '4K', multiplier: Math.max(3840 / this.canvasService.canvasWidth(), 1), tag: 'HD' },
  ];

  readonly outputWidth = computed(() =>
    Math.round(this.canvasService.canvasWidth() * this.selectedRes().multiplier)
  );

  readonly outputHeight = computed(() =>
    Math.round(this.canvasService.canvasHeight() * this.selectedRes().multiplier)
  );

  toggleBatchSize(name: string): void {
    this.selectedBatchSizes.update(set => {
      const next = new Set(set);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  setPagesData(pages: { canvasJson: string }[], currentPageJson: string): void {
    this.pagesData.set(pages);
    this.currentPageJson.set(currentPageJson);
  }

  close(): void {
    this.dialogRef.close();
  }

  async doExport(): Promise<void> {
    const fmt = this.selectedFormat();
    const w = this.outputWidth();
    const h = this.outputHeight();
    const transparent = this.transparentBg() && fmt !== 'jpeg';

    if (fmt === 'batch') {
      const sizes = this.batchSizePresets.filter(s => this.selectedBatchSizes().has(s.name));
      if (sizes.length === 0) {
        return;
      }
      await this.exportService.exportBatchSizes(this.fileName, sizes, 'png');
      this.dialogRef.close();
      return;
    }

    if (fmt === 'video') {
      await this.exportService.exportVideo(this.fileName, this.videoDuration());
      this.dialogRef.close();
      return;
    }

    if (fmt === 'gif') {
      const pages = this.pagesData().length > 0 ? this.pagesData() : [{ canvasJson: this.currentPageJson() }];
      await this.exportService.exportAnimatedGIF(
        this.fileName,
        pages,
        this.gifFrameDelay(),
        this.currentPageJson(),
      );
      this.dialogRef.close();
      return;
    }

    if (fmt === 'pdf') {
      if (this.pdfPageRange() === 'all' && this.pagesData().length > 1) {
        await this.exportService.exportMultiPagePDF(
          this.fileName,
          this.pagesData(),
          this.currentPageJson(),
        );
      } else {
        await this.exportService.exportPDF(this.fileName);
      }
      this.dialogRef.close();
      return;
    } else if (fmt === 'svg') {
      this.exportService.exportSVG(this.fileName);
    } else {
      this.exportService.exportImage(
        {
          format: fmt,
          quality: this.quality / 100,
          width: w,
          height: h,
          transparent,
        },
        this.fileName,
      );
    }

    this.dialogRef.close();
  }
}
