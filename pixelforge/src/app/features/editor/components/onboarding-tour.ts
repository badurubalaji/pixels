import { Component, signal, computed, OnInit, ElementRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface TourStep {
  selector: string;
  title: string;
  body: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_KEY = 'pixelforge_tour_completed';

const TOUR_STEPS: TourStep[] = [
  {
    selector: '.icon-rail',
    title: 'Sidebar Tools',
    body: 'Access shapes, text, uploads, AI tools, brand kit, widgets and more from this rail.',
    position: 'right',
  },
  {
    selector: '.canvas-wrapper',
    title: 'Your Canvas',
    body: 'This is where your design lives. Drag, resize, and arrange elements freely.',
    position: 'top',
  },
  {
    selector: '.right-panel',
    title: 'Properties & Layers',
    body: 'When you select an element, edit all its properties here. Layers are also visible at the bottom.',
    position: 'left',
  },
  {
    selector: '.export-btn',
    title: 'Export Anywhere',
    body: 'Download as PNG, SVG, PDF (with real text!), GIF, video, or batch-export multiple sizes at once.',
    position: 'bottom',
  },
  {
    selector: '.save-btn',
    title: 'Auto-saved',
    body: 'Your work is saved automatically. Sign in to sync across devices.',
    position: 'bottom',
  },
];

@Component({
  selector: 'app-onboarding-tour',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (active() && currentStep(); as step) {
      <div class="tour-overlay" (click)="skip()">
        @if (highlightRect(); as rect) {
          <div class="tour-spotlight" [style.top.px]="rect.top - 8" [style.left.px]="rect.left - 8"
            [style.width.px]="rect.width + 16" [style.height.px]="rect.height + 16"></div>
        }

        <div class="tour-tooltip" [style.top.px]="tooltipPos().top" [style.left.px]="tooltipPos().left"
          [class]="'pos-' + (step.position || 'bottom')" (click)="$event.stopPropagation()">
          <div class="tour-step-num">Step {{ stepIndex() + 1 }} of {{ totalSteps }}</div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.body }}</p>
          <div class="tour-actions">
            <button mat-button (click)="skip()">Skip tour</button>
            @if (stepIndex() > 0) {
              <button mat-stroked-button (click)="prev()">Back</button>
            }
            @if (stepIndex() < totalSteps - 1) {
              <button mat-flat-button class="next-btn" (click)="next()">Next</button>
            } @else {
              <button mat-flat-button class="next-btn" (click)="finish()">
                <mat-icon>check</mat-icon> Get Started
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tour-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9700;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn { from { opacity: 0; } }

    .tour-spotlight {
      position: fixed;
      border-radius: 12px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
      border: 3px solid var(--mat-sys-primary);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
      animation: pulse-spot 2s ease-in-out infinite;
    }

    @keyframes pulse-spot {
      0%, 100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(124, 58, 237, 0.4); }
      50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 12px rgba(124, 58, 237, 0); }
    }

    .tour-tooltip {
      position: fixed;
      width: 320px;
      max-width: 90vw;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);

      .tour-step-num {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--mat-sys-primary);
        font-weight: 600;
        margin-bottom: 4px;
      }

      h3 {
        margin: 0 0 6px;
        font-size: 1.05rem;
      }

      p {
        margin: 0 0 14px;
        font-size: 0.85rem;
        opacity: 0.8;
        line-height: 1.45;
      }
    }

    .tour-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      align-items: center;

      .next-btn {
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);

        mat-icon { margin-right: 4px; font-size: 18px; height: 18px; width: 18px; }
      }
    }
  `],
})
export class OnboardingTour implements OnInit {
  readonly active = signal(false);
  readonly stepIndex = signal(0);
  readonly highlightRect = signal<DOMRect | null>(null);

  readonly totalSteps = TOUR_STEPS.length;
  readonly currentStep = computed(() => TOUR_STEPS[this.stepIndex()] ?? null);

  readonly tooltipPos = computed(() => {
    const rect = this.highlightRect();
    const step = this.currentStep();
    if (!rect || !step) return { top: 100, left: 100 };

    const ttWidth = 320;
    const ttHeight = 200; // approximate
    const margin = 20;

    switch (step.position) {
      case 'top':
        return {
          top: Math.max(20, rect.top - ttHeight - margin),
          left: Math.max(20, Math.min(window.innerWidth - ttWidth - 20, rect.left + rect.width / 2 - ttWidth / 2)),
        };
      case 'bottom':
        return {
          top: Math.min(window.innerHeight - ttHeight - 20, rect.bottom + margin),
          left: Math.max(20, Math.min(window.innerWidth - ttWidth - 20, rect.left + rect.width / 2 - ttWidth / 2)),
        };
      case 'left':
        return {
          top: Math.max(20, Math.min(window.innerHeight - ttHeight - 20, rect.top + rect.height / 2 - ttHeight / 2)),
          left: Math.max(20, rect.left - ttWidth - margin),
        };
      case 'right':
      default:
        return {
          top: Math.max(20, Math.min(window.innerHeight - ttHeight - 20, rect.top + rect.height / 2 - ttHeight / 2)),
          left: Math.min(window.innerWidth - ttWidth - 20, rect.right + margin),
        };
    }
  });

  ngOnInit(): void {
    // Auto-start tour for first-time users
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      // Wait for editor UI to render
      setTimeout(() => this.start(), 1000);
    }
  }

  start(): void {
    this.stepIndex.set(0);
    this.active.set(true);
    this.updateHighlight();
  }

  next(): void {
    if (this.stepIndex() < this.totalSteps - 1) {
      this.stepIndex.update(i => i + 1);
      this.updateHighlight();
    }
  }

  prev(): void {
    if (this.stepIndex() > 0) {
      this.stepIndex.update(i => i - 1);
      this.updateHighlight();
    }
  }

  skip(): void {
    this.active.set(false);
    localStorage.setItem(TOUR_KEY, 'skipped');
  }

  finish(): void {
    this.active.set(false);
    localStorage.setItem(TOUR_KEY, 'completed');
  }

  private updateHighlight(): void {
    const step = this.currentStep();
    if (!step) return;
    setTimeout(() => {
      const el = document.querySelector(step.selector) as HTMLElement;
      if (el) {
        this.highlightRect.set(el.getBoundingClientRect());
      } else {
        // If element not found, skip step
        this.next();
      }
    }, 100);
  }
}
