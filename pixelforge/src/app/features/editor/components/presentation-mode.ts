import { Component, inject, signal, computed, OnDestroy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface PresentationPage {
  thumbnail?: string;
  canvasJson: string;
}

@Component({
  selector: 'app-presentation-mode',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    @if (active()) {
      <div class="presentation-overlay" (click)="onBackdropClick($event)">
        <div class="presentation-stage">
          @if (currentPage(); as page) {
            @if (page.thumbnail) {
              <img [src]="page.thumbnail" alt="Slide" />
            } @else {
              <div class="empty-slide">
                <mat-icon>image</mat-icon>
                <p>This page has no content yet</p>
              </div>
            }
          }
        </div>

        <div class="presentation-controls">
          <button mat-icon-button class="ctrl-btn" (click)="prev()" [disabled]="currentIndex() === 0" matTooltip="Previous (←)">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <span class="page-indicator">
            {{ currentIndex() + 1 }} / {{ pages().length }}
          </span>

          <button mat-icon-button class="ctrl-btn" (click)="next()" [disabled]="currentIndex() >= pages().length - 1" matTooltip="Next (→)">
            <mat-icon>chevron_right</mat-icon>
          </button>

          <span class="ctrl-sep"></span>

          <button mat-icon-button class="ctrl-btn" (click)="exit()" matTooltip="Exit (Esc)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .presentation-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 9500;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .presentation-stage {
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
    }

    .empty-slide {
      color: #71717a;
      text-align: center;

      mat-icon {
        font-size: 80px;
        height: 80px;
        width: 80px;
        opacity: 0.3;
      }
    }

    .presentation-controls {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(24, 24, 27, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 32px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .ctrl-btn {
      color: #fafafa !important;

      &:disabled {
        opacity: 0.3;
      }
    }

    .ctrl-sep {
      width: 1px;
      height: 20px;
      background: #3f3f46;
      margin: 0 4px;
    }

    .page-indicator {
      color: #d4d4d8;
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
      padding: 0 8px;
    }
  `],
})
export class PresentationMode implements OnDestroy {
  pages = input<PresentationPage[]>([]);
  startIndex = input(0);
  closed = output<void>();

  readonly active = signal(false);
  readonly currentIndex = signal(0);

  readonly currentPage = computed(() => this.pages()[this.currentIndex()] ?? null);

  private keyHandler = (e: KeyboardEvent) => {
    if (!this.active()) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.exit();
    }
  };

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keyHandler);
  }

  start(index: number = 0): void {
    this.currentIndex.set(index);
    this.active.set(true);
    document.addEventListener('keydown', this.keyHandler);

    // Try to enter fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  exit(): void {
    this.active.set(false);
    document.removeEventListener('keydown', this.keyHandler);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    this.closed.emit();
  }

  prev(): void {
    this.currentIndex.update(i => Math.max(0, i - 1));
  }

  next(): void {
    this.currentIndex.update(i => Math.min(this.pages().length - 1, i + 1));
  }

  onBackdropClick(event: MouseEvent): void {
    // Only exit if clicking the backdrop itself, not controls or stage
    const target = event.target as HTMLElement;
    if (target.classList.contains('presentation-overlay')) {
      this.exit();
    }
  }
}
