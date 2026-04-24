import { Component, inject, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { ShapeType } from '../../../core/services/canvas.service';
import { TemplateService, LOGO_TEMPLATES } from '../../../core/services/template.service';

@Component({
  selector: 'app-toolbar-panel',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule,
  ],
  template: `
    <aside class="toolbar-panel">
      <!-- Templates -->
      <button mat-icon-button matTooltip="Logo Templates" [matMenuTriggerFor]="templateMenu">
        <mat-icon>auto_awesome</mat-icon>
      </button>

      <mat-menu #templateMenu="matMenu" class="template-menu">
        @for (tpl of templates; track tpl.id) {
          <button mat-menu-item (click)="applyTemplate(tpl.id)">
            <mat-icon>{{ tpl.icon }}</mat-icon>
            <div>
              <div>{{ tpl.name }}</div>
              <small class="tpl-desc">{{ tpl.description }}</small>
            </div>
          </button>
        }
      </mat-menu>

      <mat-divider />

      <!-- Text -->
      <button mat-icon-button matTooltip="Add Text" (click)="addText.emit()">
        <mat-icon>title</mat-icon>
      </button>

      <mat-divider />

      <!-- Shapes -->
      <button mat-icon-button matTooltip="Rectangle" (click)="addShape.emit('rect')">
        <mat-icon>rectangle</mat-icon>
      </button>
      <button mat-icon-button matTooltip="Circle" (click)="addShape.emit('circle')">
        <mat-icon>circle</mat-icon>
      </button>
      <button mat-icon-button matTooltip="Triangle" (click)="addShape.emit('triangle')">
        <mat-icon>change_history</mat-icon>
      </button>

      <!-- More shapes -->
      <button mat-icon-button matTooltip="More Shapes" [matMenuTriggerFor]="shapeMenu">
        <mat-icon>more_horiz</mat-icon>
      </button>

      <mat-menu #shapeMenu="matMenu">
        <button mat-menu-item (click)="addShape.emit('star')">
          <mat-icon>star</mat-icon> Star
        </button>
        <button mat-menu-item (click)="addShape.emit('polygon')">
          <mat-icon>pentagon</mat-icon> Pentagon
        </button>
        <button mat-menu-item (click)="addShape.emit('hexagon')">
          <mat-icon>hexagon</mat-icon> Hexagon
        </button>
        <button mat-menu-item (click)="addShape.emit('diamond')">
          <mat-icon>diamond</mat-icon> Diamond
        </button>
        <button mat-menu-item (click)="addShape.emit('arrow')">
          <mat-icon>arrow_right_alt</mat-icon> Arrow
        </button>
        <button mat-menu-item (click)="addShape.emit('line')">
          <mat-icon>horizontal_rule</mat-icon> Line
        </button>
      </mat-menu>

      <mat-divider />

      <!-- Image -->
      <button mat-icon-button matTooltip="Upload Image" (click)="addImage.emit()">
        <mat-icon>add_photo_alternate</mat-icon>
      </button>

      <button mat-icon-button matTooltip="Remove Background" (click)="removeBackground.emit()">
        <mat-icon>auto_fix_high</mat-icon>
      </button>

      <mat-divider />

      <!-- Delete -->
      <button mat-icon-button matTooltip="Delete Selected" (click)="deleteSelected.emit()">
        <mat-icon>delete_outline</mat-icon>
      </button>
    </aside>
  `,
  styles: [`
    .toolbar-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 8px;
      width: 56px;
      background: var(--mat-sys-surface-container);
      border-right: 1px solid var(--mat-sys-outline-variant);
      overflow-y: auto;
    }

    mat-divider {
      width: 32px;
      margin: 4px 0;
    }

    .tpl-desc {
      font-size: 0.75rem;
      opacity: 0.6;
    }
  `],
})
export class ToolbarPanelComponent {
  private readonly templateService = inject(TemplateService);

  readonly templates = LOGO_TEMPLATES;

  addText = output<void>();
  addShape = output<ShapeType>();
  addImage = output<void>();
  removeBackground = output<void>();
  deleteSelected = output<void>();

  applyTemplate(id: string): void {
    this.templateService.applyTemplate(id);
  }
}
