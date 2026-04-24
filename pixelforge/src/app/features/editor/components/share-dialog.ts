import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-share-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="share-dialog">
      <div class="dialog-header">
        <h2>Share Design</h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        @if (shareLink(); as link) {
          <p class="info">Anyone with this link can view your design (read-only):</p>
          <div class="link-row">
            <input readonly class="link-input" [value]="link" #linkInput (click)="linkInput.select()" />
            <button mat-flat-button class="copy-btn" (click)="copyLink()">
              <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
              {{ copied() ? 'Copied' : 'Copy' }}
            </button>
          </div>

          <details class="embed-section">
            <summary>
              <mat-icon>code</mat-icon>
              Embed in a website
            </summary>
            <div class="embed-body">
              <div class="embed-options">
                <label>
                  <span>Width</span>
                  <input type="number" min="200" max="2000" [(ngModel)]="embedWidth" />
                </label>
                <label>
                  <span>Height</span>
                  <input type="number" min="150" max="2000" [(ngModel)]="embedHeight" />
                </label>
              </div>
              <div class="link-row">
                <textarea readonly class="link-input embed-code" rows="3" [value]="embedCode()" #embedBox (click)="embedBox.select()"></textarea>
                <button mat-flat-button class="copy-btn" (click)="copyEmbed()">
                  <mat-icon>{{ embedCopied() ? 'check' : 'content_copy' }}</mat-icon>
                  {{ embedCopied() ? 'Copied' : 'Copy' }}
                </button>
              </div>
            </div>
          </details>

          <button mat-stroked-button class="revoke-btn" (click)="revoke()">
            <mat-icon>link_off</mat-icon>
            Stop sharing
          </button>
        } @else {
          <p class="info">Generate a public link to share this design with anyone.</p>
          <button mat-flat-button class="generate-btn" (click)="generate()" [disabled]="loading()">
            <mat-icon>share</mat-icon>
            Generate Share Link
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .share-dialog { width: 480px; }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 8px;
      h2 { margin: 0; font-size: 1.2rem; font-weight: 700; }
    }
    .dialog-body { padding: 12px 24px 24px; }
    .info {
      margin: 0 0 16px;
      font-size: 0.88rem;
      opacity: 0.7;
    }
    .link-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .link-input {
        flex: 1;
        padding: 10px 12px;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        color: inherit;
        font-size: 0.82rem;
        font-family: monospace;
        outline: none;

        &:focus { border-color: var(--mat-sys-primary); }
      }
    }
    .generate-btn, .copy-btn {
      height: 40px;
    }
    .embed-section {
      margin: 12px 0 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;

      summary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        cursor: pointer;
        font-size: 0.88rem;
        font-weight: 600;
        user-select: none;

        mat-icon {
          font-size: 18px;
          height: 18px;
          width: 18px;
          color: var(--mat-sys-primary);
        }
      }
    }

    .embed-body {
      padding: 0 14px 14px;
    }

    .embed-options {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;

      label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        opacity: 0.7;

        input {
          width: 80px;
          padding: 5px 8px;
          background: var(--mat-sys-surface-container-highest);
          border: 1px solid var(--mat-sys-outline-variant);
          border-radius: 4px;
          color: inherit;
          font-variant-numeric: tabular-nums;
        }
      }
    }

    .embed-code {
      resize: vertical;
      min-height: 60px;
      font-family: monospace !important;
      font-size: 0.76rem !important;
    }

    .revoke-btn {
      width: 100%;
      color: var(--mat-sys-error);
    }
  `],
})
export class ShareDialog {
  private readonly apiService = inject(ApiService);
  private readonly dialogRef = inject(MatDialogRef<ShareDialog>);
  private readonly data = inject<{ projectId: string }>(MAT_DIALOG_DATA);
  private readonly snack = inject(MatSnackBar);

  readonly shareLink = signal<string | null>(null);
  readonly copied = signal(false);
  readonly loading = signal(false);

  // Embed code state
  embedWidth = 800;
  embedHeight = 600;
  readonly embedCopied = signal(false);

  readonly embedCode = computed(() => {
    const link = this.shareLink();
    if (!link) return '';
    return `<iframe src="${link}" width="${this.embedWidth}" height="${this.embedHeight}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
  });

  copyEmbed(): void {
    const code = this.embedCode();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.embedCopied.set(true);
      setTimeout(() => this.embedCopied.set(false), 2000);
    });
  }

  generate(): void {
    this.loading.set(true);
    this.apiService.createShareLink(this.data.projectId).subscribe({
      next: (res) => {
        const link = `${window.location.origin}/auth?shared=${res.share_token}`;
        this.shareLink.set(link);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Failed to generate share link', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  copyLink(): void {
    const link = this.shareLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  revoke(): void {
    this.apiService.revokeShareLink(this.data.projectId).subscribe({
      next: () => {
        this.shareLink.set(null);
        this.snack.open('Share link revoked', 'OK', { duration: 2000 });
      },
    });
  }
}
