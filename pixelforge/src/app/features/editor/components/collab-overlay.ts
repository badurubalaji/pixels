import { Component, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { CanvasService } from '../../../core/services/canvas.service';

@Component({
  selector: 'app-collab-overlay',
  imports: [MatTooltipModule],
  template: `
    @if (collab.connected()) {
      <div class="collab-bar">
        <div class="connection-dot"></div>
        <span class="bar-label">Live</span>

        @for (user of collab.remoteUsers(); track user.userId) {
          <div class="user-chip" [matTooltip]="user.userName" [style.background]="user.color">
            {{ initial(user.userName) }}
          </div>
        }

        @if (collab.remoteUsers().length === 0) {
          <span class="alone">You're the only one here</span>
        }
      </div>
    }

    <!-- Remote cursors layer -->
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
    :host {
      display: contents;
    }

    .collab-bar {
      position: fixed;
      top: 64px;
      right: 320px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(24, 24, 27, 0.85);
      backdrop-filter: blur(8px);
      border-radius: 16px;
      z-index: 100;
      font-size: 0.78rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .connection-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .bar-label {
      color: #d4d4d8;
      font-weight: 600;
    }

    .alone {
      color: #71717a;
      font-size: 0.72rem;
      margin-left: 8px;
    }

    .user-chip {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
      border: 2px solid #18181b;
    }

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

  initial(name: string): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }
}
