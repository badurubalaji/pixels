import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CanvasService } from '../../../core/services/canvas.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import * as fabric from 'fabric';

/**
 * Canva-style floating "mini" action bar that appears BELOW the selected
 * object. Includes the most common quick actions: alignment, duplicate,
 * lock, delete. Keeps the main formatting toolbar above uncluttered.
 */
@Component({
  selector: 'app-quick-action-bar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  template: `
    @if (visible()) {
      <div
        class="qa-bar"
        [class.dragging]="isDragging()"
        [style.top.px]="top()"
        [style.left.px]="left()"
      >
        <span
          class="qa-drag-handle"
          matTooltip="Drag to move"
          (mousedown)="onDragHandleDown($event)"
        >
          <mat-icon>drag_indicator</mat-icon>
        </span>
        <button mat-icon-button [matMenuTriggerFor]="alignMenu" matTooltip="Align to page">
          <mat-icon>format_align_center</mat-icon>
        </button>
        <mat-menu #alignMenu="matMenu">
          <button mat-menu-item (click)="align('left')"><mat-icon>align_horizontal_left</mat-icon>Left</button>
          <button mat-menu-item (click)="align('center-h')"><mat-icon>align_horizontal_center</mat-icon>Center horizontally</button>
          <button mat-menu-item (click)="align('right')"><mat-icon>align_horizontal_right</mat-icon>Right</button>
          <button mat-menu-item (click)="align('top')"><mat-icon>align_vertical_top</mat-icon>Top</button>
          <button mat-menu-item (click)="align('center-v')"><mat-icon>align_vertical_center</mat-icon>Center vertically</button>
          <button mat-menu-item (click)="align('bottom')"><mat-icon>align_vertical_bottom</mat-icon>Bottom</button>
        </mat-menu>

        @if (isMultiSelection()) {
          <button mat-icon-button matTooltip="Group (Ctrl+G)" (click)="group()">
            <mat-icon>group_work</mat-icon>
          </button>
        } @else if (isGroup()) {
          <button mat-icon-button matTooltip="Ungroup (Ctrl+Shift+G)" (click)="ungroup()">
            <mat-icon>workspaces</mat-icon>
          </button>
        }

        <button mat-icon-button matTooltip="Duplicate (Ctrl+D)" (click)="duplicate()">
          <mat-icon>content_copy</mat-icon>
        </button>

        <button mat-icon-button [matTooltip]="isLocked() ? 'Unlock' : 'Lock (Alt+Shift+L)'" (click)="toggleLock()">
          <mat-icon>{{ isLocked() ? 'lock' : 'lock_open' }}</mat-icon>
        </button>

        <span class="qa-sep"></span>

        <button mat-icon-button class="qa-delete" matTooltip="Delete" (click)="deleteSelected()">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 50;
    }

    .qa-bar {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 6px;
      background: #1e1e22;
      border: 1px solid #3f3f46;
      border-radius: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      transform: translateX(-50%);
      transition: top 0.1s ease-out, left 0.1s ease-out;

      button {
        transform: scale(0.85);
      }
    }

    .qa-bar.dragging {
      transition: none;
      cursor: grabbing;
      user-select: none;
    }

    .qa-drag-handle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 28px;
      color: #71717a;
      cursor: grab;
      border-radius: 14px;
      flex-shrink: 0;

      &:hover {
        color: #a1a1aa;
        background: #27272a;
      }

      &:active {
        cursor: grabbing;
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .qa-sep {
      width: 1px;
      height: 22px;
      background: #3f3f46;
      margin: 0 2px;
    }

    .qa-delete {
      color: #ef4444 !important;

      &:hover {
        background: rgba(239, 68, 68, 0.15) !important;
      }
    }
  `],
})
export class QuickActionBar implements OnInit, OnDestroy {
  private readonly canvasService = inject(CanvasService);
  private readonly clipboardService = inject(ClipboardService);

  readonly visible = signal(false);
  readonly top = signal(0);
  readonly left = signal(0);
  readonly isMultiSelection = signal(false);
  readonly isGroup = signal(false);
  readonly isLocked = signal(false);

  // Drag state for manual repositioning of the floating bar.
  readonly isDragging = signal(false);
  private userOffsetX = 0;
  private userOffsetY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartOffsetX = 0;
  private dragStartOffsetY = 0;
  private dragMoveListener: ((e: MouseEvent) => void) | null = null;
  private dragUpListener: ((e: MouseEvent) => void) | null = null;

  private listeners: (() => void)[] = [];

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

    const update = () => {
      const obj = canvas.getActiveObject();
      if (!obj) {
        this.visible.set(false);
        return;
      }
      this.isMultiSelection.set(obj instanceof fabric.ActiveSelection);
      this.isGroup.set(obj instanceof fabric.Group && !(obj instanceof fabric.ActiveSelection));
      this.isLocked.set(!!(obj as any)._locked);
      this.reposition();
      this.visible.set(true);
    };

    const onNewSelection = () => {
      this.resetDragOffset();
      update();
    };

    const hide = () => {
      this.resetDragOffset();
      this.visible.set(false);
    };

    canvas.on('selection:created', onNewSelection);
    canvas.on('selection:updated', onNewSelection);
    canvas.on('selection:cleared', hide);
    canvas.on('object:modified', update);
    canvas.on('object:moving', () => this.reposition());
    canvas.on('object:scaling', () => this.reposition());
    canvas.on('object:rotating', () => this.reposition());
    canvas.on('after:render', () => {
      if (this.visible()) this.reposition();
    });

    this.listeners = [
      () => canvas.off('selection:created', onNewSelection),
      () => canvas.off('selection:updated', onNewSelection),
      () => canvas.off('selection:cleared', hide),
      () => canvas.off('object:modified', update),
    ];

    update();
  }

  ngOnDestroy(): void {
    this.listeners.forEach(fn => fn());
  }

  private reposition(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;

    const upperEl = canvas.upperCanvasEl as HTMLCanvasElement | undefined;
    if (!upperEl) return;

    const b = obj.getBoundingRect();
    const canvasRect = upperEl.getBoundingClientRect();
    const screenLeft = canvasRect.left + b.left;
    const screenTop = canvasRect.top + b.top;
    const screenBottom = screenTop + b.height;
    const screenCenterX = screenLeft + b.width / 2;

    const gap = 10;
    const barHeight = 44;

    let top: number;
    if (screenBottom + gap + barHeight < window.innerHeight - 8) {
      top = screenBottom + gap;
    } else {
      // No room below, place above-above the top toolbar
      top = Math.max(8, screenTop - gap - barHeight);
    }

    const vw = window.innerWidth;
    const halfBar = 160;
    let left = screenCenterX;
    if (left - halfBar < 8) left = halfBar + 8;
    if (left + halfBar > vw - 8) left = vw - halfBar - 8;

    this.top.set(top + this.userOffsetY);
    this.left.set(left + this.userOffsetX);
  }

  /** Start dragging the quick-action bar from its grip handle. */
  onDragHandleDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging.set(true);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartOffsetX = this.userOffsetX;
    this.dragStartOffsetY = this.userOffsetY;

    this.dragMoveListener = (e: MouseEvent) => {
      this.userOffsetX = this.dragStartOffsetX + (e.clientX - this.dragStartX);
      this.userOffsetY = this.dragStartOffsetY + (e.clientY - this.dragStartY);
      this.reposition();
    };
    this.dragUpListener = () => {
      this.isDragging.set(false);
      if (this.dragMoveListener) window.removeEventListener('mousemove', this.dragMoveListener);
      if (this.dragUpListener) window.removeEventListener('mouseup', this.dragUpListener);
      this.dragMoveListener = null;
      this.dragUpListener = null;
    };

    window.addEventListener('mousemove', this.dragMoveListener);
    window.addEventListener('mouseup', this.dragUpListener);
  }

  private resetDragOffset(): void {
    this.userOffsetX = 0;
    this.userOffsetY = 0;
  }

  // --- Actions ---

  align(direction: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    this.canvasService.alignObjects(direction);
  }

  group(): void { this.canvasService.groupSelected(); }
  ungroup(): void { this.canvasService.ungroupSelected(); }

  duplicate(): void { this.clipboardService.duplicate(); }

  deleteSelected(): void { this.canvasService.removeActiveObject(); }

  toggleLock(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    const locked = !(obj as any)._locked;
    (obj as any)._locked = locked;
    // Keep the object selectable/evented so the user can re-click it to
    // unlock. Only lock transforms and hide controls/borders.
    obj.set({
      selectable: true,
      evented: true,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockSkewingX: locked,
      lockSkewingY: locked,
      hasControls: !locked,
      hasBorders: true,
      hoverCursor: locked ? 'not-allowed' : 'move',
    });
    this.isLocked.set(locked);
    canvas!.requestRenderAll();
    this.canvasService.commitChange(obj);
  }
}
