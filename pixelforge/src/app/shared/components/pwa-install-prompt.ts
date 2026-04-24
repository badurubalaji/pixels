import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pixelforge_pwa_dismissed';

@Component({
  selector: 'app-pwa-install-prompt',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <div class="install-prompt">
        <div class="install-content">
          <mat-icon class="install-icon">install_mobile</mat-icon>
          <div class="install-text">
            <strong>Install Pixelforge</strong>
            <span>Get the app for faster access and offline use</span>
          </div>
        </div>
        <div class="install-actions">
          <button mat-button (click)="dismiss()">Not now</button>
          <button mat-flat-button class="install-btn" (click)="install()">
            <mat-icon>download</mat-icon>
            Install
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .install-prompt {
      position: fixed;
      bottom: 16px;
      left: 16px;
      right: 16px;
      max-width: 480px;
      margin: 0 auto;
      padding: 14px 16px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      z-index: 9999;
      animation: slideUp 0.3s ease;

      @media (max-width: 480px) {
        flex-direction: column;
        align-items: stretch;
      }
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .install-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;

      .install-icon {
        font-size: 28px;
        height: 28px;
        width: 28px;
        color: var(--mat-sys-primary);
        flex-shrink: 0;
      }

      .install-text {
        display: flex;
        flex-direction: column;
        min-width: 0;

        strong { font-size: 0.92rem; }
        span { font-size: 0.78rem; opacity: 0.65; }
      }
    }

    .install-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;

      .install-btn {
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
      }
    }
  `],
})
export class PwaInstallPrompt implements OnInit, OnDestroy {
  readonly visible = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private installHandler = (e: Event) => {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;

    // Don't show if user already dismissed within last 7 days
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Show after a short delay
    setTimeout(() => this.visible.set(true), 4000);
  };

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.installHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.installHandler);
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.visible.set(false);
    await this.deferredPrompt.prompt();
    this.deferredPrompt = null;
  }

  dismiss(): void {
    this.visible.set(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
}
