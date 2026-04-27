import { Component, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { CanvasService } from '../../../core/services/canvas.service';

@Component({
  selector: 'app-collab-overlay',
  imports: [MatTooltipModule],
  template: `
    <!-- Remote cursors layer (full-viewport, fixed) -->
    <div class="cursors-layer">
      @for (user of collab.remoteUsers(); track user.userId) {
        @if (user.cursorX !== undefined && user.cursorY !== undefined) {
          <div
            class="remote-cursor"
            [style.left.px]="screenX(user.cursorX!)"
            [style.top.px]="screenY(user.cursorY!)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" [attr.fill]="user.color">
              <path d="M2 2 L18 10 L10 12 L8 18 Z" stroke="white" stroke-width="1"/>
            </svg>
            <span class="cursor-label" [style.background]="user.color">{{ user.userName }}</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .cursors-layer {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9000;
    }

    .remote-cursor {
      position: absolute;
      transform: translate(-2px, -2px);
      transition: top 0.05s linear, left 0.05s linear;
    }

    .cursor-label {
      position: absolute;
      top: 14px;
      left: 14px;
      padding: 2px 6px;
      color: white;
      font-size: 0.7rem;
      border-radius: 4px;
      white-space: nowrap;
    }
  `],
})
export class CollabOverlay {
  readonly collab = inject(CollaborationService);
  private readonly canvasService = inject(CanvasService);

  screenX(canvasX: number): number {
    return canvasX;
  }

  screenY(canvasY: number): number {
    return canvasY;
  }
}

/**
 * PX-157 — minimal "live" indicator for the editor topbar. Renders a
 * single pulsing green dot whenever the collab socket is connected; nothing
 * at all otherwise. Hover for "Live • N collaborator(s)". Designed to be
 * dropped inline in the topbar so the live state is visible without
 * eating canvas real estate the way the old floating bar did.
 */
@Component({
  selector: 'app-collab-status-dot',
  imports: [MatTooltipModule],
  template: `
    @if (collab.connected()) {
      <span
        class="live-dot"
        data-testid="live-dot"
        [matTooltip]="tooltipLabel()"
        matTooltipPosition="below"
      ></span>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      margin: 0 6px;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
      animation: live-pulse 2s ease-in-out infinite;
    }
    @keyframes live-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `],
})
export class CollabStatusDot {
  readonly collab = inject(CollaborationService);

  tooltipLabel(): string {
    const n = this.collab.remoteUsers().length;
    if (n === 0) return 'Live';
    return `Live · ${n} collaborator${n === 1 ? '' : 's'}`;
  }
}
