import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CanvasService, BackgroundMode } from '../../../core/services/canvas.service';

@Component({
  selector: 'app-background-panel',
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="bg-panel">
      <span class="label">Background</span>

      <mat-button-toggle-group
        [ngModel]="canvasService.backgroundMode()"
        (ngModelChange)="onModeChange($event)"
      >
        <mat-button-toggle value="white">
          <mat-icon>format_color_fill</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="transparent">
          <mat-icon>grid_on</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="custom">
          <mat-icon>palette</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>

      @if (canvasService.backgroundMode() === 'custom') {
        <div class="custom-color">
          <input
            type="color"
            [ngModel]="canvasService.backgroundColor()"
            (ngModelChange)="onCustomColor($event)"
            class="color-input"
          />
          <mat-form-field appearance="outline" class="hex-field">
            <input
              matInput
              [ngModel]="canvasService.backgroundColor()"
              (ngModelChange)="onCustomColor($event)"
            />
          </mat-form-field>
        </div>
      }
    </div>
  `,
  styles: [`
    .bg-panel {
      padding: 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      .label {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.5;
        display: block;
        margin-bottom: 8px;
      }

      mat-button-toggle-group {
        width: 100%;
      }

      .custom-color {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;

        .color-input {
          width: 36px;
          height: 36px;
          border: 2px solid var(--mat-sys-outline-variant);
          border-radius: 6px;
          cursor: pointer;
          padding: 0;
          background: none;
        }

        .hex-field {
          flex: 1;
        }
      }
    }
  `],
})
export class BackgroundPanelComponent {
  readonly canvasService = inject(CanvasService);

  onModeChange(mode: BackgroundMode): void {
    this.canvasService.setBackgroundMode(mode);
  }

  onCustomColor(color: string): void {
    this.canvasService.setBackgroundMode('custom', color);
  }
}
