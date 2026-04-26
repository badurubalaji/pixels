import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Context type the floating toolbar adapts to. Driven from the editor
 * by reading the active fabric selection on each `selection:*` event.
 */
export type ContextToolbarContext =
  | 'image'
  | 'text'
  | 'shape'
  | 'group'
  | 'none';

/**
 * PX-141 — Floating context toolbar mounted directly above the canvas.
 *
 * @remarks
 * Surfaces the most-common verbs for whatever the user has selected,
 * Canva-style: image-specific actions when an image is selected, text
 * formatting when text is selected, and so on. The right-hand property
 * panel keeps the fine-grained controls; this toolbar is the
 * one-click path for the common verbs.
 *
 * Presentation only — every action emits an output that the editor
 * routes to the matching service method. This keeps the toolbar
 * stateless and easy to test (`context` input + which output fires).
 */
@Component({
  selector: 'app-context-toolbar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, MatDividerModule],
  template: `
    @if (context() !== 'none') {
      <aside
        class="context-toolbar"
        data-testid="context-toolbar"
        [attr.data-context]="context()"
      >
        @switch (context()) {
          @case ('image') {
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
            <button
              mat-icon-button
              data-testid="ctx-front"
              matTooltip="Bring to front"
              (click)="bringToFront.emit()"
            >
              <mat-icon>flip_to_front</mat-icon>
            </button>
            <button
              mat-icon-button
              data-testid="ctx-back"
              matTooltip="Send to back"
              (click)="sendToBack.emit()"
            >
              <mat-icon>flip_to_back</mat-icon>
            </button>
            <mat-divider vertical />
            <button
              mat-icon-button
              data-testid="ctx-delete"
              matTooltip="Delete"
              (click)="deleteSelected.emit()"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }

          @case ('text') {
            <button
              mat-icon-button
              data-testid="ctx-bold"
              matTooltip="Bold"
              (click)="toggleBold.emit()"
            >
              <mat-icon>format_bold</mat-icon>
            </button>
            <button
              mat-icon-button
              data-testid="ctx-italic"
              matTooltip="Italic"
              (click)="toggleItalic.emit()"
            >
              <mat-icon>format_italic</mat-icon>
            </button>
            <button
              mat-icon-button
              data-testid="ctx-underline"
              matTooltip="Underline"
              (click)="toggleUnderline.emit()"
            >
              <mat-icon>format_underlined</mat-icon>
            </button>
            <mat-divider vertical />
            <button
              mat-icon-button
              data-testid="ctx-front"
              matTooltip="Bring to front"
              (click)="bringToFront.emit()"
            >
              <mat-icon>flip_to_front</mat-icon>
            </button>
            <button
              mat-icon-button
              data-testid="ctx-back"
              matTooltip="Send to back"
              (click)="sendToBack.emit()"
            >
              <mat-icon>flip_to_back</mat-icon>
            </button>
            <mat-divider vertical />
            <button
              mat-icon-button
              data-testid="ctx-delete"
              matTooltip="Delete"
              (click)="deleteSelected.emit()"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }

          @case ('shape') {
            <button
              mat-icon-button
              data-testid="ctx-front"
              matTooltip="Bring to front"
              (click)="bringToFront.emit()"
            >
              <mat-icon>flip_to_front</mat-icon>
            </button>
            <button
              mat-icon-button
              data-testid="ctx-back"
              matTooltip="Send to back"
              (click)="sendToBack.emit()"
            >
              <mat-icon>flip_to_back</mat-icon>
            </button>
            <mat-divider vertical />
            <button
              mat-icon-button
              data-testid="ctx-delete"
              matTooltip="Delete"
              (click)="deleteSelected.emit()"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }

          @case ('group') {
            <button
              mat-stroked-button
              class="ctx-btn"
              data-testid="ctx-group"
              matTooltip="Group selected"
              (click)="groupSelected.emit()"
            >
              <mat-icon>library_add</mat-icon>
              Group
            </button>
            <button
              mat-stroked-button
              class="ctx-btn"
              data-testid="ctx-ungroup"
              matTooltip="Ungroup"
              (click)="ungroupSelected.emit()"
            >
              <mat-icon>library_books</mat-icon>
              Ungroup
            </button>
            <mat-divider vertical />
            <button
              mat-icon-button
              data-testid="ctx-front"
              matTooltip="Bring to front"
              (click)="bringToFront.emit()"
            >
              <mat-icon>flip_to_front</mat-icon>
            </button>
            <button
              mat-icon-button
              data-testid="ctx-back"
              matTooltip="Send to back"
              (click)="sendToBack.emit()"
            >
              <mat-icon>flip_to_back</mat-icon>
            </button>
            <mat-divider vertical />
            <button
              mat-icon-button
              data-testid="ctx-delete"
              matTooltip="Delete"
              (click)="deleteSelected.emit()"
            >
              <mat-icon>delete</mat-icon>
            </button>
          }
        }
      </aside>
    }
  `,
  styles: [
    `
      .context-toolbar {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow:
          0 4px 16px rgba(0, 0, 0, 0.12),
          0 1px 3px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.06);
        margin-bottom: 12px;
        align-self: center;
      }
      .ctx-btn {
        height: 36px;
        font-weight: 500;
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
      mat-divider[vertical] {
        height: 24px;
        margin: 0 4px;
        border-left: 1px solid rgba(0, 0, 0, 0.08);
      }
    `,
  ],
})
export class ContextToolbarComponent {
  /**
   * Which context the toolbar should render. Set by the editor based on
   * the active fabric selection. Defaults to `'none'` (hidden) for
   * defensive rendering — callers always pass an explicit value.
   */
  readonly context = input<ContextToolbarContext>('none');

  // --- Image context -------------------------------------------------------

  /** Fires for the image context's primary "Remove Background" action. */
  readonly removeBackground = output<void>();

  // --- Text context --------------------------------------------------------

  /** Fires for the text context's Bold toggle. */
  readonly toggleBold = output<void>();
  /** Fires for the text context's Italic toggle. */
  readonly toggleItalic = output<void>();
  /** Fires for the text context's Underline toggle. */
  readonly toggleUnderline = output<void>();

  // --- Group context -------------------------------------------------------

  /** Fires for the group context's Group action. */
  readonly groupSelected = output<void>();
  /** Fires for the group context's Ungroup action. */
  readonly ungroupSelected = output<void>();

  // --- Shared (image / text / shape / group) -------------------------------

  /** Fires when the user requests bring-to-front in any context. */
  readonly bringToFront = output<void>();
  /** Fires when the user requests send-to-back in any context. */
  readonly sendToBack = output<void>();
  /** Fires when the user requests deleting the active selection. */
  readonly deleteSelected = output<void>();
}
