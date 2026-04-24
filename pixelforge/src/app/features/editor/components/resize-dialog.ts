import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CanvasService } from '../../../core/services/canvas.service';

interface SizePreset {
  name: string;
  width: number;
  height: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'Facebook Cover', width: 820, height: 312 },
  { name: 'Twitter Header', width: 1500, height: 500 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'A4 Portrait', width: 2480, height: 3508 },
  { name: 'A4 Landscape', width: 3508, height: 2480 },
  { name: 'Business Card', width: 1050, height: 600 },
  { name: 'HD', width: 1920, height: 1080 },
  { name: '4K', width: 3840, height: 2160 },
  { name: 'Square', width: 1000, height: 1000 },
];

@Component({
  selector: 'app-resize-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="resize-dialog">
      <div class="dialog-header">
        <h2>Resize Canvas</h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        <div class="label">Presets</div>
        <div class="presets-grid">
          @for (p of presets; track p.name) {
            <button class="preset-btn" (click)="applyPreset(p)">
              <strong>{{ p.name }}</strong>
              <span>{{ p.width }} × {{ p.height }}</span>
            </button>
          }
        </div>

        <div class="label">Custom Size</div>
        <div class="size-inputs">
          <mat-form-field appearance="outline" class="size-field">
            <mat-label>Width (px)</mat-label>
            <input matInput type="number" min="100" max="8000" [ngModel]="width()" (ngModelChange)="width.set($event)" />
          </mat-form-field>
          <mat-icon class="link-icon">link</mat-icon>
          <mat-form-field appearance="outline" class="size-field">
            <mat-label>Height (px)</mat-label>
            <input matInput type="number" min="100" max="8000" [ngModel]="height()" (ngModelChange)="height.set($event)" />
          </mat-form-field>
        </div>

        <div class="resize-mode">
          <button class="mode-btn" [class.active]="resizeMode() === 'keep'" (click)="resizeMode.set('keep')">
            <mat-icon>aspect_ratio</mat-icon>
            <strong>Keep Size</strong>
            <span>Resize canvas only</span>
          </button>
          <button class="mode-btn" [class.active]="resizeMode() === 'scale'" (click)="resizeMode.set('scale')">
            <mat-icon>open_in_full</mat-icon>
            <strong>Scale Content</strong>
            <span>Stretch to fit</span>
          </button>
          <button class="mode-btn" [class.active]="resizeMode() === 'magic'" (click)="resizeMode.set('magic')">
            <mat-icon>auto_awesome</mat-icon>
            <strong>Magic Resize</strong>
            <span>Smart adjust</span>
          </button>
        </div>

        <div class="info">
          <mat-icon>info_outline</mat-icon>
          <span>{{ modeDescription() }}</span>
        </div>
      </div>

      <div class="dialog-footer">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-flat-button class="apply-btn" (click)="apply()">
          Apply
        </button>
      </div>
    </div>
  `,
  styles: [`
    .resize-dialog { width: 520px; }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 8px;
      h2 { margin: 0; font-size: 1.2rem; font-weight: 700; }
    }
    .dialog-body { padding: 8px 24px 16px; }
    .label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.5;
      margin: 16px 0 8px;
    }
    .presets-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .preset-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 8px 12px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid transparent;
      border-radius: 8px;
      color: inherit;
      cursor: pointer;
      transition: all 0.15s;

      strong { font-size: 0.82rem; }
      span { font-size: 0.72rem; opacity: 0.5; margin-top: 2px; font-variant-numeric: tabular-nums; }

      &:hover {
        border-color: var(--mat-sys-primary);
      }
    }
    .size-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
      .size-field { flex: 1; }
      .link-icon { opacity: 0.4; font-size: 18px; height: 18px; width: 18px; }
    }
    .resize-mode {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 8px 0;
    }

    .mode-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px 8px;
      background: var(--mat-sys-surface-container-high);
      border: 2px solid transparent;
      border-radius: 10px;
      color: inherit;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;

      mat-icon {
        font-size: 22px;
        height: 22px;
        width: 22px;
        opacity: 0.7;
      }

      strong { font-size: 0.82rem; }
      span { font-size: 0.7rem; opacity: 0.5; }

      &:hover { border-color: var(--mat-sys-outline); }

      &.active {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);

        mat-icon { opacity: 1; color: var(--mat-sys-primary); }
      }
    }

    .info {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding: 10px;
      background: var(--mat-sys-surface-container-highest);
      border-radius: 8px;
      font-size: 0.78rem;
      opacity: 0.7;

      mat-icon { font-size: 18px; height: 18px; width: 18px; flex-shrink: 0; }
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 24px 20px;
    }
    .apply-btn { padding: 8px 28px; }
  `],
})
export class ResizeDialog {
  private readonly canvasService = inject(CanvasService);
  private readonly dialogRef = inject(MatDialogRef<ResizeDialog>);

  readonly presets = SIZE_PRESETS;
  readonly width = signal(this.canvasService.canvasWidth());
  readonly height = signal(this.canvasService.canvasHeight());
  readonly resizeMode = signal<'keep' | 'scale' | 'magic'>('magic');

  readonly modeDescription = computed(() => {
    switch (this.resizeMode()) {
      case 'keep': return 'Canvas resizes; objects keep their current size and position.';
      case 'scale': return 'All objects scale proportionally to fit the new canvas exactly.';
      case 'magic': return 'Smart resize repositions objects relative to canvas center while keeping text readable.';
    }
  });

  applyPreset(preset: SizePreset): void {
    this.width.set(preset.width);
    this.height.set(preset.height);
  }

  apply(): void {
    const mode = this.resizeMode();
    if (mode === 'magic') {
      this.canvasService.magicResize(this.width(), this.height());
    } else {
      this.canvasService.resizeCanvasWithScale(
        this.width(),
        this.height(),
        mode === 'scale',
      );
    }
    this.dialogRef.close();
  }
}
