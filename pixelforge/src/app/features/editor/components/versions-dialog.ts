import { Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface VersionEntry {
  id: string;
  project_id: string;
  thumbnail?: string;
  created_at: string;
  note?: string;
}

@Component({
  selector: 'app-versions-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DatePipe,
  ],
  template: `
    <div class="versions-dialog">
      <div class="dialog-header">
        <h2>Version History</h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        <button mat-stroked-button class="snapshot-btn" (click)="createSnapshot()">
          <mat-icon>bookmark_add</mat-icon>
          Save current as new version
        </button>

        @if (loading()) {
          <div class="loading-msg">Loading versions...</div>
        } @else if (versions().length === 0) {
          <div class="empty-msg">
            <mat-icon>history</mat-icon>
            <p>No saved versions yet. Save one to start tracking history.</p>
          </div>
        } @else {
          <div class="versions-list">
            @for (v of versions(); track v.id; let i = $index) {
              <div class="version-card">
                <div class="version-thumb">
                  @if (v.thumbnail) {
                    <img [src]="v.thumbnail" alt="Version thumbnail" />
                  } @else {
                    <mat-icon>image</mat-icon>
                  }
                </div>
                <div class="version-info">
                  <strong>Version {{ versions().length - i }}</strong>
                  <span class="date">{{ v.created_at | date: 'MMM d, y · h:mm a' }}</span>
                  @if (v.note) {
                    <span class="note">{{ v.note }}</span>
                  }
                </div>
                <button mat-stroked-button (click)="restore(v.id)">
                  <mat-icon>restore</mat-icon>
                  Restore
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .versions-dialog { width: 620px; max-height: 80vh; }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 8px;
      h2 { margin: 0; font-size: 1.2rem; font-weight: 700; }
    }
    .dialog-body { padding: 8px 24px 24px; overflow-y: auto; max-height: 60vh; }

    .snapshot-btn {
      width: 100%;
      height: 40px;
      margin-bottom: 16px;
    }

    .loading-msg, .empty-msg {
      text-align: center;
      padding: 40px 20px;
      opacity: 0.5;
      font-size: 0.9rem;

      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin-bottom: 8px;
      }
    }

    .versions-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .version-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      border: 1px solid transparent;
      transition: border-color 0.15s;

      &:hover { border-color: var(--mat-sys-outline-variant); }
    }

    .version-thumb {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      overflow: hidden;
      background: var(--mat-sys-surface-container-highest);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img { width: 100%; height: 100%; object-fit: cover; }
      mat-icon { opacity: 0.4; font-size: 28px; height: 28px; width: 28px; }
    }

    .version-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;

      strong { font-size: 0.88rem; }
      .date { font-size: 0.78rem; opacity: 0.6; }
      .note { font-size: 0.78rem; font-style: italic; opacity: 0.7; }
    }
  `],
})
export class VersionsDialog implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly dialogRef = inject(MatDialogRef<VersionsDialog>);
  private readonly data = inject<{ projectId: string }>(MAT_DIALOG_DATA);
  private readonly snack = inject(MatSnackBar);

  readonly versions = signal<VersionEntry[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadVersions();
  }

  loadVersions(): void {
    this.loading.set(true);
    this.apiService.listVersions(this.data.projectId).subscribe({
      next: (v) => {
        this.versions.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load versions', 'OK', { duration: 2500 });
      },
    });
  }

  createSnapshot(): void {
    this.apiService.createVersion(this.data.projectId).subscribe({
      next: () => {
        this.snack.open('Version saved', 'OK', { duration: 2000 });
        this.loadVersions();
      },
      error: () => this.snack.open('Failed to save version', 'OK', { duration: 2500 }),
    });
  }

  restore(versionId: string): void {
    if (!confirm('Restore this version? Your current unsaved changes will be replaced.')) return;

    this.apiService.restoreVersion(this.data.projectId, versionId).subscribe({
      next: () => {
        this.snack.open('Version restored. Reload to see changes.', 'Reload', { duration: 5000 })
          .onAction().subscribe(() => window.location.reload());
        this.dialogRef.close(true);
      },
      error: () => this.snack.open('Failed to restore version', 'OK', { duration: 2500 }),
    });
  }
}
