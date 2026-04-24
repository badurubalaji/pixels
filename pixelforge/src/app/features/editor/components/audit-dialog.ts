import { Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccessibilityService, AuditIssue } from '../../../core/services/accessibility.service';
import { CanvasService } from '../../../core/services/canvas.service';

@Component({
  selector: 'app-audit-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="audit-dialog">
      <div class="dialog-header">
        <h2>
          <mat-icon class="header-icon">verified_user</mat-icon>
          Design Audit
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        @if (issues().length === 0) {
          <div class="all-good">
            <mat-icon>celebration</mat-icon>
            <h3>Looking great!</h3>
            <p>No accessibility issues found in your design.</p>
          </div>
        } @else {
          <div class="audit-summary">
            @if (errorCount() > 0) {
              <span class="summary-pill error">
                <mat-icon>error</mat-icon> {{ errorCount() }} {{ errorCount() === 1 ? 'error' : 'errors' }}
              </span>
            }
            @if (warningCount() > 0) {
              <span class="summary-pill warning">
                <mat-icon>warning</mat-icon> {{ warningCount() }} {{ warningCount() === 1 ? 'warning' : 'warnings' }}
              </span>
            }
            @if (infoCount() > 0) {
              <span class="summary-pill info">
                <mat-icon>info</mat-icon> {{ infoCount() }} {{ infoCount() === 1 ? 'tip' : 'tips' }}
              </span>
            }
          </div>

          <div class="issues-list">
            @for (issue of issues(); track issue.id) {
              <div class="issue-item" [class]="'severity-' + issue.severity" (click)="selectObject(issue)">
                <mat-icon class="issue-icon">
                  @switch (issue.severity) {
                    @case ('error') { error }
                    @case ('warning') { warning }
                    @case ('info') { info }
                  }
                </mat-icon>
                <div class="issue-content">
                  <div class="issue-message">{{ issue.message }}</div>
                  @if (issue.fix) {
                    <div class="issue-fix"><mat-icon>tips_and_updates</mat-icon> {{ issue.fix }}</div>
                  }
                </div>
                @if (issue.objectId) {
                  <button mat-icon-button class="goto-btn" matTooltip="Go to element" (click)="$event.stopPropagation(); selectObject(issue)">
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>

      <div class="dialog-footer">
        <button mat-button (click)="rerun()">
          <mat-icon>refresh</mat-icon>
          Re-run audit
        </button>
        <button mat-flat-button mat-dialog-close>Done</button>
      </div>
    </div>
  `,
  styles: [`
    .audit-dialog { width: 600px; max-height: 80vh; }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px 8px;

      h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon {
          color: var(--mat-sys-primary);
        }
      }
    }

    .dialog-body {
      padding: 8px 24px 16px;
      overflow-y: auto;
      max-height: 60vh;
    }

    .all-good {
      text-align: center;
      padding: 40px 20px;

      mat-icon {
        font-size: 56px;
        height: 56px;
        width: 56px;
        color: #10b981;
        margin-bottom: 12px;
      }

      h3 { margin: 0 0 4px; font-size: 1.1rem; }
      p { margin: 0; opacity: 0.6; font-size: 0.9rem; }
    }

    .audit-summary {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .summary-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.78rem;
      font-weight: 600;

      mat-icon { font-size: 16px; height: 16px; width: 16px; }

      &.error {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
      }
      &.warning {
        background: rgba(245, 158, 11, 0.12);
        color: #f59e0b;
      }
      &.info {
        background: rgba(59, 130, 246, 0.12);
        color: #3b82f6;
      }
    }

    .issues-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .issue-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 8px;
      background: var(--mat-sys-surface-container-high);
      cursor: pointer;
      transition: transform 0.1s;
      border-left: 3px solid transparent;

      &:hover {
        transform: translateX(2px);
      }

      &.severity-error { border-left-color: #ef4444; }
      &.severity-warning { border-left-color: #f59e0b; }
      &.severity-info { border-left-color: #3b82f6; }

      .issue-icon {
        flex-shrink: 0;
        font-size: 20px;
        height: 20px;
        width: 20px;
        margin-top: 2px;
      }

      .severity-error .issue-icon { color: #ef4444; }
      .severity-warning .issue-icon { color: #f59e0b; }
      .severity-info .issue-icon { color: #3b82f6; }

      .issue-content {
        flex: 1;

        .issue-message {
          font-size: 0.88rem;
          line-height: 1.4;
        }

        .issue-fix {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          font-size: 0.75rem;
          opacity: 0.6;

          mat-icon { font-size: 14px; height: 14px; width: 14px; }
        }
      }

      .goto-btn {
        flex-shrink: 0;
        transform: scale(0.8);
        opacity: 0.6;

        &:hover { opacity: 1; }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px 20px;
    }
  `],
})
export class AuditDialog implements OnInit {
  private readonly a11y = inject(AccessibilityService);
  private readonly canvasService = inject(CanvasService);
  private readonly dialogRef = inject(MatDialogRef<AuditDialog>);

  readonly issues = signal<AuditIssue[]>([]);

  ngOnInit(): void {
    this.rerun();
  }

  rerun(): void {
    this.issues.set(this.a11y.audit());
  }

  errorCount(): number { return this.issues().filter(i => i.severity === 'error').length; }
  warningCount(): number { return this.issues().filter(i => i.severity === 'warning').length; }
  infoCount(): number { return this.issues().filter(i => i.severity === 'info').length; }

  selectObject(issue: AuditIssue): void {
    if (!issue.objectId) return;
    this.canvasService.selectLayer(issue.objectId);
    this.dialogRef.close();
  }
}
