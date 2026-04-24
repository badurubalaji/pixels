import { Component, inject, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BRAND_PALETTES, ColorPalette } from '../../../core/models/color-palettes';
import { CanvasService } from '../../../core/services/canvas.service';

@Component({
  selector: 'app-color-palette-panel',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="palette-panel">
      <div class="panel-header">
        <h3>Colors</h3>
      </div>

      <!-- Quick color input -->
      <div class="quick-color">
        <input
          type="color"
          [ngModel]="currentColor()"
          (ngModelChange)="applyColor($event)"
          class="color-picker"
        />
        <mat-form-field appearance="outline" class="hex-input">
          <mat-label>Hex</mat-label>
          <input
            matInput
            [ngModel]="currentColor()"
            (ngModelChange)="applyColor($event)"
            placeholder="#000000"
          />
        </mat-form-field>
      </div>

      <!-- Recent Colors -->
      @if (recentColors().length > 0) {
        <div class="section">
          <span class="section-label">Recent</span>
          <div class="color-grid">
            @for (color of recentColors(); track color) {
              <button
                class="color-swatch"
                [style.background]="color"
                [matTooltip]="color"
                (click)="applyColor(color)"
              ></button>
            }
          </div>
        </div>
      }

      <!-- Brand Palettes -->
      @for (palette of palettes; track palette.name) {
        <div class="section">
          <span class="section-label">{{ palette.name }}</span>
          <div class="color-grid">
            @for (color of palette.colors; track color) {
              <button
                class="color-swatch"
                [style.background]="color"
                [matTooltip]="color"
                (click)="applyColor(color)"
              ></button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .palette-panel {
      padding: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .panel-header h3 {
      margin: 0 0 12px;
      font-size: 0.9rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
    }

    .quick-color {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;

      .color-picker {
        width: 40px;
        height: 40px;
        border: 2px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        cursor: pointer;
        padding: 0;
        background: none;
      }

      .hex-input {
        flex: 1;
      }
    }

    .section {
      margin-bottom: 12px;

      .section-label {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.5;
        display: block;
        margin-bottom: 6px;
      }
    }

    .color-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .color-swatch {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;

      &:hover {
        transform: scale(1.2);
        border-color: var(--mat-sys-primary);
      }
    }
  `],
})
export class ColorPalettePanelComponent {
  private readonly canvasService = inject(CanvasService);

  readonly palettes = BRAND_PALETTES;
  readonly currentColor = signal('#000000');
  readonly recentColors = signal<string[]>([]);

  colorApplied = output<string>();

  applyColor(color: string): void {
    if (!color || !color.startsWith('#')) return;

    this.currentColor.set(color);

    const canvas = this.canvasService.getCanvas();
    const active = canvas?.getActiveObject();
    if (active) {
      active.set('fill', color);
      canvas!.renderAll();
    }

    // Add to recents
    this.recentColors.update(colors => {
      const filtered = colors.filter(c => c !== color);
      return [color, ...filtered].slice(0, 12);
    });

    this.colorApplied.emit(color);
  }
}
