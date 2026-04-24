import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CanvasService } from '../../../core/services/canvas.service';
import * as fabric from 'fabric';

@Component({
  selector: 'app-alignment-panel',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonToggleModule,
  ],
  template: `
    <div class="alignment-panel">
      <div class="align-target-row">
        <span class="label">Align to</span>
        <mat-button-toggle-group [ngModel]="alignMode()" (ngModelChange)="alignMode.set($event)" class="target-toggle">
          <mat-button-toggle value="canvas" matTooltip="Align to canvas">
            <mat-icon>crop_landscape</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="selection" matTooltip="Align within selection" [disabled]="!hasMultiSelection()">
            <mat-icon>select_all</mat-icon>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>
      <div class="align-buttons">
        <button mat-icon-button matTooltip="Align Left" (click)="align('left')">
          <mat-icon>align_horizontal_left</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Center Horizontal" (click)="align('center-h')">
          <mat-icon>align_horizontal_center</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Align Right" (click)="align('right')">
          <mat-icon>align_horizontal_right</mat-icon>
        </button>
        <span class="sep"></span>
        <button mat-icon-button matTooltip="Align Top" (click)="align('top')">
          <mat-icon>align_vertical_top</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Center Vertical" (click)="align('center-v')">
          <mat-icon>align_vertical_center</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Align Bottom" (click)="align('bottom')">
          <mat-icon>align_vertical_bottom</mat-icon>
        </button>
      </div>
      <span class="label" style="margin-top: 8px;">Distribute</span>
      <div class="align-buttons">
        <button mat-icon-button matTooltip="Distribute Horizontally" (click)="distribute('horizontal')">
          <mat-icon>horizontal_distribute</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Distribute Vertically" (click)="distribute('vertical')">
          <mat-icon>vertical_distribute</mat-icon>
        </button>
      </div>

      <span class="label" style="margin-top: 8px;">Smart Layout</span>
      <div class="align-buttons">
        <button mat-stroked-button class="smart-btn" matTooltip="Auto-arrange selected" (click)="autoArrange()">
          <mat-icon>auto_awesome_motion</mat-icon>
          Auto Arrange
        </button>
        <button mat-icon-button matTooltip="Fix overlapping objects" (click)="fixOverlaps()">
          <mat-icon>filter_none</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .alignment-panel {
      padding: 8px 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      .align-target-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .label {
          margin-bottom: 0;
          flex: 1;
        }

        .target-toggle ::ng-deep .mat-button-toggle-label-content {
          padding: 0 6px !important;
          line-height: 28px !important;
        }
      }

      .label {
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.5;
        display: block;
        margin-bottom: 4px;
      }

      .align-buttons {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .sep {
        width: 1px;
        height: 20px;
        background: var(--mat-sys-outline-variant);
        margin: 0 4px;
      }

      .smart-btn {
        flex: 1;
        font-size: 0.78rem;
        padding: 4px 8px;
        line-height: 1.3;

        mat-icon {
          font-size: 16px;
          height: 16px;
          width: 16px;
          margin-right: 4px;
        }
      }
    }
  `],
})
export class AlignmentPanelComponent {
  private readonly canvasService = inject(CanvasService);

  readonly alignMode = signal<'canvas' | 'selection'>('canvas');
  readonly hasMultiSelection = signal(false);

  constructor() {
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
      const active = canvas.getActiveObject();
      const isMulti = active instanceof fabric.ActiveSelection;
      this.hasMultiSelection.set(isMulti);
      if (isMulti) {
        this.alignMode.set('selection');
      } else {
        this.alignMode.set('canvas');
      }
    };

    canvas.on('selection:created', checkSelection);
    canvas.on('selection:updated', checkSelection);
    canvas.on('selection:cleared', () => {
      this.hasMultiSelection.set(false);
      this.alignMode.set('canvas');
    });
    checkSelection();
  }

  align(direction: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    this.canvasService.alignObjects(direction, this.alignMode());
  }

  distribute(direction: 'horizontal' | 'vertical'): void {
    this.canvasService.distributeObjects(direction);
  }

  autoArrange(): void {
    this.canvasService.autoArrangeSelection();
  }

  fixOverlaps(): void {
    this.canvasService.fixOverlaps();
  }
}
