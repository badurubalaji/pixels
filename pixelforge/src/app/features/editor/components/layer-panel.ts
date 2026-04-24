import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CanvasService } from '../../../core/services/canvas.service';

@Component({
  selector: 'app-layer-panel',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSliderModule,
    DragDropModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <aside class="layer-panel">
      <div class="panel-header">
        <h3>Layers</h3>
        <mat-form-field appearance="outline" class="layer-search" subscriptSizing="dynamic">
          <input matInput placeholder="Filter layers..." [ngModel]="layerSearch()" (ngModelChange)="layerSearch.set($event)" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="layer-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
        @for (layer of filteredLayers(); track layer.id) {
          <div
            class="layer-item"
            cdkDrag
            [class.active]="layer.id === canvasService.activeLayerId()"
            [class.hidden-layer]="!layer.visible"
            [class.locked-layer]="layer.locked"
            (click)="canvasService.selectLayer(layer.id)"
          >
            <mat-icon class="drag-handle" cdkDragHandle>drag_indicator</mat-icon>
            <mat-icon class="layer-icon">
              @switch (layer.type) {
                @case ('image') { image }
                @case ('text') { title }
                @case ('shape') { category }
                @default { layers }
              }
            </mat-icon>
            <span class="layer-name">{{ layer.name }}</span>
            <button
              mat-icon-button
              class="layer-action"
              [matTooltip]="layer.locked ? 'Unlock layer' : 'Lock layer'"
              (click)="toggleLock($event, layer.id)"
            >
              <mat-icon>
                {{ layer.locked ? 'lock' : 'lock_open' }}
              </mat-icon>
            </button>
            <button
              mat-icon-button
              class="layer-action"
              [matTooltip]="layer.visible ? 'Hide layer' : 'Show layer'"
              (click)="toggleVisibility($event, layer.id)"
            >
              <mat-icon>
                {{ layer.visible ? 'visibility' : 'visibility_off' }}
              </mat-icon>
            </button>
          </div>
          @if (layer.id === canvasService.activeLayerId()) {
            <div class="layer-opacity-row" (click)="$event.stopPropagation()">
              <span class="opacity-label">Opacity</span>
              <mat-slider min="0" max="1" step="0.01" class="opacity-slider">
                <input matSliderThumb [ngModel]="layer.opacity" (ngModelChange)="setLayerOpacity(layer.id, $event)" />
              </mat-slider>
              <span class="opacity-value">{{ (layer.opacity * 100).toFixed(0) }}%</span>
            </div>
          }
        } @empty {
          <div class="empty-layers">
            <p>No layers yet</p>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .layer-panel {
      background: var(--mat-sys-surface-container);
      border-top: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }

    .panel-header {
      padding: 8px 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      h3 {
        margin: 0 0 6px;
        font-size: 0.9rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.7;
      }

      .layer-search {
        width: 100%;
        font-size: 0.8rem;
      }
    }

    .layer-list {
      flex: 1;
      overflow-y: auto;
    }

    .layer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      transition: background 0.15s;

      &:hover {
        background: rgba(128, 128, 128, 0.1);
      }

      &.active {
        background: rgba(var(--mat-sys-primary), 0.12);
        border-left: 3px solid var(--mat-sys-primary);
      }

      &.hidden-layer {
        opacity: 0.4;
      }

      &.locked-layer .layer-name {
        font-style: italic;
      }

      .drag-handle {
        font-size: 18px;
        height: 18px;
        width: 18px;
        opacity: 0.3;
        cursor: grab;

        &:active {
          cursor: grabbing;
        }
      }

      .layer-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        opacity: 0.6;
      }

      .layer-name {
        flex: 1;
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .layer-action {
        opacity: 0.5;
        transform: scale(0.8);

        &:hover {
          opacity: 1;
        }
      }
    }

    .layer-opacity-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 12px 6px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      .opacity-label {
        font-size: 0.7rem;
        opacity: 0.5;
        min-width: 42px;
      }

      .opacity-slider {
        flex: 1;
      }

      .opacity-value {
        font-size: 0.7rem;
        min-width: 30px;
        text-align: right;
        opacity: 0.6;
      }
    }

    .cdk-drag-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--mat-sys-surface-container-highest);
      border: 1px solid var(--mat-sys-primary);
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 200ms ease;
    }

    .cdk-drop-list-dragging .layer-item:not(.cdk-drag-placeholder) {
      transition: transform 200ms ease;
    }

    .empty-layers {
      padding: 24px;
      text-align: center;
      opacity: 0.4;
      font-size: 0.85rem;
    }
  `],
})
export class LayerPanelComponent {
  readonly canvasService = inject(CanvasService);
  readonly layerSearch = signal('');

  readonly filteredLayers = computed(() => {
    const search = this.layerSearch().toLowerCase();
    const layers = this.canvasService.layers();
    if (!search) return layers;
    return layers.filter(l => l.name.toLowerCase().includes(search));
  });

  onDrop(event: CdkDragDrop<void>): void {
    this.canvasService.reorderLayers(event.previousIndex, event.currentIndex);
  }

  toggleVisibility(event: Event, layerId: string): void {
    event.stopPropagation();
    this.canvasService.toggleLayerVisibility(layerId);
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    this.canvasService.setLayerOpacity(layerId, opacity);
  }

  toggleLock(event: Event, layerId: string): void {
    event.stopPropagation();
    this.canvasService.toggleLayerLock(layerId);
  }
}
