import {
  Component,
  inject,
  input,
  output,
  signal,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CanvasService } from '../../../core/services/canvas.service';

/**
 * Context type the floating toolbar adapts to. Driven from the editor
 * by reading the active fabric selection on each `selection:*` event.
 */
export type ContextToolbarContext =
  | 'image'
  | 'text'
  | 'shape'
  | 'group'
  | 'multiple'
  | 'none';

/**
 * PX-141 / PX-157 — Floating object-verb toolbar anchored above the
 * active selection.
 *
 * @remarks
 * After PX-157 this bar owns object verbs *only* (lock, duplicate,
 * delete, plus an overflow menu for layer/align/group). All formatting
 * controls live in the docked `app-text-toolbar` under the editor
 * header to mirror Canva's split: stationary formatting up top, small
 * floating action bar above the selection. The image variant keeps its
 * "Remove Background" primary action because it's the highest-value
 * one-click verb for that selection type.
 *
 * Positioning math is bbox-anchored — the toolbar follows the selected
 * object as it moves / scales / rotates and as the canvas pans / zooms,
 * clamped inside the viewport. Falls back to below the object when
 * there isn't enough room above.
 *
 * Stateless: every action emits an output that the editor routes to a
 * canvas-service method.
 */
@Component({
  selector: 'app-context-toolbar',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    @if (context() !== 'none') {
      <aside
        class="context-toolbar"
        data-testid="context-toolbar"
        [attr.data-context]="context()"
        [style.top.px]="toolbarTop()"
        [style.left.px]="toolbarLeft()"
      >
        @if (context() === 'image') {
          <button
            mat-flat-button
            class="ctx-btn ctx-btn--primary"
            data-testid="ctx-remove-bg"
            matTooltip="Remove background using AI"
            (click)="removeBackground.emit()"
          >
            <mat-icon>auto_fix_high</mat-icon>
            Remove Background
          </button>
          <mat-divider vertical />
        }

        @if (context() === 'multiple') {
          <button
            mat-stroked-button
            class="ctx-btn"
            data-testid="ctx-group"
            matTooltip="Group (Ctrl+G)"
            (click)="groupSelected.emit()"
          >
            <mat-icon>group_work</mat-icon>
            Group
          </button>
          <mat-divider vertical />
        } @else if (context() === 'group') {
          <button
            mat-stroked-button
            class="ctx-btn"
            data-testid="ctx-ungroup"
            matTooltip="Ungroup (Ctrl+Shift+G)"
            (click)="ungroupSelected.emit()"
          >
            <mat-icon>workspaces</mat-icon>
            Ungroup
          </button>
          <mat-divider vertical />
        }

        <button
          mat-icon-button
          data-testid="ctx-lock"
          [matTooltip]="locked() ? 'Unlock' : 'Lock (Alt+Shift+L)'"
          (click)="toggleLock.emit()"
        >
          <mat-icon>{{ locked() ? 'lock' : 'lock_open' }}</mat-icon>
        </button>

        <button
          mat-icon-button
          data-testid="ctx-duplicate"
          matTooltip="Duplicate (Ctrl+D)"
          (click)="duplicateSelected.emit()"
        >
          <mat-icon>content_copy</mat-icon>
        </button>

        <button
          mat-icon-button
          class="ctx-delete"
          data-testid="ctx-delete"
          matTooltip="Delete"
          (click)="deleteSelected.emit()"
        >
          <mat-icon>delete</mat-icon>
        </button>

        <mat-divider vertical />

        <button
          mat-icon-button
          data-testid="ctx-more"
          matTooltip="More actions"
          [matMenuTriggerFor]="moreMenu"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>
        <mat-menu #moreMenu="matMenu">
          <button mat-menu-item (click)="bringToFront.emit()">
            <mat-icon>flip_to_front</mat-icon>
            <span>Bring to front</span>
          </button>
          <button mat-menu-item (click)="sendToBack.emit()">
            <mat-icon>flip_to_back</mat-icon>
            <span>Send to back</span>
          </button>
          <mat-divider />
          <button mat-menu-item [matMenuTriggerFor]="alignMenu">
            <mat-icon>format_align_center</mat-icon>
            <span>Align to page</span>
          </button>
        </mat-menu>
        <mat-menu #alignMenu="matMenu">
          <button mat-menu-item (click)="alignSelected.emit('left')">
            <mat-icon>align_horizontal_left</mat-icon><span>Left</span>
          </button>
          <button mat-menu-item (click)="alignSelected.emit('center-h')">
            <mat-icon>align_horizontal_center</mat-icon><span>Center horizontally</span>
          </button>
          <button mat-menu-item (click)="alignSelected.emit('right')">
            <mat-icon>align_horizontal_right</mat-icon><span>Right</span>
          </button>
          <button mat-menu-item (click)="alignSelected.emit('top')">
            <mat-icon>align_vertical_top</mat-icon><span>Top</span>
          </button>
          <button mat-menu-item (click)="alignSelected.emit('center-v')">
            <mat-icon>align_vertical_center</mat-icon><span>Center vertically</span>
          </button>
          <button mat-menu-item (click)="alignSelected.emit('bottom')">
            <mat-icon>align_vertical_bottom</mat-icon><span>Bottom</span>
          </button>
        </mat-menu>
      </aside>
    }
  `,
  styles: [
    `
      :host {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 50;
      }
      .context-toolbar {
        position: fixed;
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 4px 8px;
        background: #ffffff;
        border-radius: 10px;
        box-shadow:
          0 8px 24px rgba(15, 23, 42, 0.18),
          0 1px 3px rgba(15, 23, 42, 0.08);
        border: 1px solid rgba(15, 23, 42, 0.06);
        pointer-events: auto;
        transform: translateX(-50%);
        transition: top 0.08s ease-out, left 0.08s ease-out;
      }
      .ctx-btn {
        height: 32px;
        font-weight: 500;
        font-size: 0.82rem;
      }
      .ctx-btn--primary {
        background: linear-gradient(
          135deg,
          var(--px-violet, #7c3aed) 0%,
          #a855f7 100%
        ) !important;
        color: #ffffff !important;
        border-radius: 8px !important;
      }
      .ctx-delete {
        color: #ef4444;
      }
      .ctx-delete:hover {
        background: rgba(239, 68, 68, 0.12) !important;
      }
      mat-divider[vertical] {
        height: 20px;
        margin: 0 4px;
        border-left: 1px solid rgba(15, 23, 42, 0.08);
      }
    `,
  ],
})
export class ContextToolbarComponent implements OnInit, OnDestroy {
  private readonly canvasService = inject(CanvasService);

  /**
   * Which context the toolbar should render. Set by the editor based on
   * the active fabric selection. Defaults to `'none'` (hidden) for
   * defensive rendering — callers always pass an explicit value.
   */
  readonly context = input<ContextToolbarContext>('none');

  /** Whether the active object is locked — controls the lock icon. */
  readonly locked = input<boolean>(false);

  // --- Object-verb outputs (uniform across every context) -----------------

  /** Toggle lock state on the active selection. */
  readonly toggleLock = output<void>();
  /** Duplicate the active selection. */
  readonly duplicateSelected = output<void>();
  /** Delete the active selection. */
  readonly deleteSelected = output<void>();
  /** Bring active selection to the very front. */
  readonly bringToFront = output<void>();
  /** Send active selection to the very back. */
  readonly sendToBack = output<void>();
  /** Align selection to the page in one of six directions. */
  readonly alignSelected = output<
    'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
  >();

  // --- Context-specific primary actions ----------------------------------

  /** Image context — kick off background removal. */
  readonly removeBackground = output<void>();
  /** Multiple-selection context — group into one object. */
  readonly groupSelected = output<void>();
  /** Group context — break a group apart. */
  readonly ungroupSelected = output<void>();

  // --- Bbox-anchored positioning -----------------------------------------

  /** Toolbar's screen position in viewport pixels. */
  readonly toolbarTop = signal(0);
  readonly toolbarLeft = signal(0);

  private listeners: (() => void)[] = [];

  constructor() {
    // Reposition immediately whenever the parent flips the context input
    // (e.g. selection switched type). The listener wiring below handles the
    // continuous case (drag / scale / pan / zoom).
    effect(() => {
      this.context();
      queueMicrotask(() => this.repositionToolbar());
    });
  }

  ngOnInit(): void {
    this.attachWhenReady();
  }

  ngOnDestroy(): void {
    this.listeners.forEach(fn => fn());
  }

  /** Canvas is created in the parent editor's ngAfterViewInit, which fires
   * AFTER child components' ngOnInit. So we poll briefly until the canvas
   * exists, then attach selection listeners. */
  private attachWhenReady(attempts = 0): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      if (attempts > 50) return;
      setTimeout(() => this.attachWhenReady(attempts + 1), 100);
      return;
    }

    const reposition = () => this.repositionToolbar();

    canvas.on('selection:created', reposition);
    canvas.on('selection:updated', reposition);
    canvas.on('object:moving', reposition);
    canvas.on('object:scaling', reposition);
    canvas.on('object:rotating', reposition);
    canvas.on('object:modified', reposition);
    canvas.on('after:render', reposition);

    this.listeners = [
      () => canvas.off('selection:created', reposition),
      () => canvas.off('selection:updated', reposition),
      () => canvas.off('object:moving', reposition),
      () => canvas.off('object:scaling', reposition),
      () => canvas.off('object:rotating', reposition),
      () => canvas.off('object:modified', reposition),
      () => canvas.off('after:render', reposition),
    ];
  }

  /**
   * Place the floating bar 12 px above the active object's bounding rect,
   * clamped to the viewport. Falls back to below the object when the top
   * edge sits too close to the viewport top.
   */
  private repositionToolbar(): void {
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

    const toolbarHeight = 40;
    const gap = 12;

    let top: number;
    if (screenTop - toolbarHeight - gap > 8) {
      top = screenTop - toolbarHeight - gap;
    } else {
      top = screenBottom + gap;
    }

    // Horizontal viewport clamp — keep the toolbar fully visible even when
    // the selection sits flush to a viewport edge.
    const vw = window.innerWidth;
    const halfToolbar = 180;
    let left = screenCenterX;
    if (left - halfToolbar < 8) left = halfToolbar + 8;
    if (left + halfToolbar > vw - 8) left = vw - halfToolbar - 8;

    this.toolbarTop.set(top);
    this.toolbarLeft.set(left);
  }
}
