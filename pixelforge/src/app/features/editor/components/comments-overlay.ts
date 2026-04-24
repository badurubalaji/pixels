import { Component, inject, signal, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommentsService, Comment } from '../../../core/services/comments.service';
import { CanvasService } from '../../../core/services/canvas.service';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { AuthService } from '../../../core/services/auth.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-comments-overlay',
  imports: [FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, DatePipe],
  template: `
    <div class="comments-layer" [class.active-mode]="commentsService.commentMode()">
      @if (commentsService.commentMode()) {
        <div class="comment-mode-banner">
          <mat-icon>chat</mat-icon>
          <span>Click anywhere on the canvas to add a comment</span>
          <button mat-button (click)="commentsService.setCommentMode(false)">Done</button>
        </div>
      }

      @for (comment of commentsService.comments(); track comment.id; let i = $index) {
        <div
          class="comment-pin"
          [class.resolved]="comment.resolved"
          [class.active]="activeComment() === comment.id"
          [style.left.px]="screenX(comment.x)"
          [style.top.px]="screenY(comment.y)"
          (click)="toggleComment($event, comment.id)"
        >
          <span class="pin-num">{{ i + 1 }}</span>
        </div>

        @if (activeComment() === comment.id) {
          <div
            class="comment-thread"
            [style.left.px]="screenX(comment.x) + 30"
            [style.top.px]="screenY(comment.y)"
            (click)="$event.stopPropagation()"
          >
            <div class="thread-header">
              <strong>{{ comment.author }}</strong>
              <span class="thread-date">{{ comment.createdAt | date: 'short' }}</span>
              <button mat-icon-button class="thread-close" (click)="closeThread()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="thread-body">
              <p class="thread-text" [innerHTML]="formatMentions(comment.text)"></p>

              @for (reply of comment.replies; track reply.id) {
                <div class="reply">
                  <div class="reply-header">
                    <strong>{{ reply.author }}</strong>
                    <span class="reply-date">{{ reply.createdAt | date: 'short' }}</span>
                  </div>
                  <p [innerHTML]="formatMentions(reply.text)"></p>
                </div>
              }

              <div class="reply-input-wrap">
                <div class="reply-input">
                  <input
                    type="text"
                    placeholder="Reply (use @ to mention)..."
                    [(ngModel)]="replyText"
                    (keydown)="onReplyKey($event)"
                    (input)="onReplyInput($event, comment.id)"
                  />
                  <button mat-icon-button (click)="submitReply(comment.id)" [disabled]="!replyText">
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
                @if (mentionTarget() === comment.id && mentionMatches().length > 0) {
                  <div class="mention-dropdown">
                    @for (user of mentionMatches(); track user; let i = $index) {
                      <button class="mention-option" [class.active]="i === mentionIndex()"
                        (click)="pickMention(user, comment.id)">
                        <span class="mention-avatar">{{ user.charAt(0).toUpperCase() }}</span>
                        @{{ user }}
                      </button>
                    }
                  </div>
                }
              </div>

              <div class="thread-actions">
                <button mat-button (click)="commentsService.toggleResolved(comment.id)">
                  <mat-icon>{{ comment.resolved ? 'replay' : 'check' }}</mat-icon>
                  {{ comment.resolved ? 'Reopen' : 'Resolve' }}
                </button>
                <button mat-button class="delete-action" (click)="deleteComment(comment.id)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </div>
            </div>
          </div>
        }
      }

      @if (newCommentX() !== null) {
        <div
          class="new-comment-popup"
          [style.left.px]="screenX(newCommentX()!) + 30"
          [style.top.px]="screenY(newCommentY()!)"
          (click)="$event.stopPropagation()"
        >
          <textarea
            #newCommentInput
            placeholder="Add a comment..."
            [(ngModel)]="newCommentText"
            (keydown.enter)="onNewEnter($event)"
            (keydown.escape)="cancelNewComment()"
            rows="3"
          ></textarea>
          <div class="popup-actions">
            <button mat-button (click)="cancelNewComment()">Cancel</button>
            <button mat-flat-button [disabled]="!newCommentText" (click)="submitNewComment()">
              Comment
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .comments-layer {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .comments-layer.active-mode {
      pointer-events: auto;
      cursor: crosshair;
    }

    .comment-mode-banner {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-radius: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      font-size: 0.85rem;
      z-index: 100;
      pointer-events: auto;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }

      button {
        color: var(--mat-sys-on-primary) !important;
      }
    }

    .comment-pin {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: #f59e0b;
      transform: translate(-50%, -100%) rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.15s;
      z-index: 50;

      &:hover {
        transform: translate(-50%, -100%) rotate(-45deg) scale(1.15);
      }

      &.resolved {
        background: #10b981;
        opacity: 0.6;
      }

      &.active {
        background: #ef4444;
        z-index: 60;
      }

      .pin-num {
        transform: rotate(45deg);
        color: white;
        font-size: 0.78rem;
        font-weight: 700;
      }
    }

    .comment-thread, .new-comment-popup {
      position: absolute;
      width: 280px;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      z-index: 70;
      transform: translateY(-50%);
    }

    .new-comment-popup {
      padding: 12px;

      textarea {
        width: 100%;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        padding: 8px;
        color: inherit;
        font: inherit;
        font-size: 0.85rem;
        outline: none;
        resize: vertical;

        &:focus {
          border-color: var(--mat-sys-primary);
        }
      }

      .popup-actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        margin-top: 8px;
      }
    }

    .thread-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      strong { font-size: 0.85rem; }
      .thread-date { font-size: 0.72rem; opacity: 0.5; flex: 1; }
      .thread-close { transform: scale(0.75); }
    }

    .thread-body {
      padding: 10px 12px;
      max-height: 360px;
      overflow-y: auto;

      .thread-text {
        margin: 0 0 8px;
        font-size: 0.85rem;
      }

      .reply {
        padding: 8px 0;
        border-top: 1px solid var(--mat-sys-outline-variant);

        .reply-header {
          display: flex;
          gap: 6px;
          align-items: baseline;
          margin-bottom: 2px;

          strong { font-size: 0.78rem; }
          .reply-date { font-size: 0.7rem; opacity: 0.5; }
        }

        p { margin: 0; font-size: 0.82rem; }
      }
    }

    .reply-input-wrap {
      position: relative;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .reply-input {
      display: flex;
      gap: 4px;

      input {
        flex: 1;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 6px;
        padding: 6px 10px;
        color: inherit;
        font-size: 0.82rem;
        outline: none;

        &:focus { border-color: var(--mat-sys-primary); }
      }
    }

    .mention-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      max-height: 180px;
      overflow-y: auto;
      margin-bottom: 4px;
      z-index: 80;
    }

    .mention-option {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      text-align: left;
      font-size: 0.85rem;

      &.active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
    }

    .mention-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 700;
    }

    ::ng-deep .mention {
      color: var(--mat-sys-primary);
      font-weight: 600;
      background: rgba(124, 58, 237, 0.12);
      padding: 1px 4px;
      border-radius: 4px;
    }

    .thread-actions {
      display: flex;
      justify-content: space-between;
      gap: 4px;
      margin-top: 8px;

      .delete-action {
        color: #ef4444;
      }
    }
  `],
})
export class CommentsOverlay implements OnInit, OnDestroy {
  readonly commentsService = inject(CommentsService);
  private readonly canvasService = inject(CanvasService);
  private readonly collabService = inject(CollaborationService);
  private readonly authService = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly activeComment = signal<string | null>(null);
  readonly newCommentX = signal<number | null>(null);
  readonly newCommentY = signal<number | null>(null);
  newCommentText = '';
  replyText = '';

  // @mentions state
  readonly mentionTarget = signal<string | null>(null); // comment id or 'new'
  readonly mentionMatches = signal<string[]>([]);
  readonly mentionIndex = signal(0);

  /** Combined list of known users for autocomplete */
  knownUsers(): string[] {
    const users = new Set<string>();
    const me = this.authService.currentUser();
    if (me?.name) users.add(me.name);

    // Add collaborators
    this.collabService.remoteUsers().forEach(u => u.userName && users.add(u.userName));

    // Add comment authors
    this.commentsService.comments().forEach(c => {
      if (c.author) users.add(c.author);
      c.replies.forEach(r => r.author && users.add(r.author));
    });

    return Array.from(users);
  }

  private clickHandler = (e: MouseEvent) => {
    if (!this.commentsService.commentMode()) return;
    const target = e.target as HTMLElement;
    if (target.closest('.comment-pin') || target.closest('.comment-thread') || target.closest('.new-comment-popup')) return;

    const rect = this.host.nativeElement.getBoundingClientRect();
    const zoom = this.canvasService.zoom();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    this.newCommentX.set(x);
    this.newCommentY.set(y);
    this.newCommentText = '';

    setTimeout(() => {
      const ta = this.host.nativeElement.querySelector('.new-comment-popup textarea') as HTMLTextAreaElement;
      ta?.focus();
    }, 50);
  };

  ngOnInit(): void {
    this.host.nativeElement.addEventListener('click', this.clickHandler);
  }

  ngOnDestroy(): void {
    this.host.nativeElement.removeEventListener('click', this.clickHandler);
  }

  screenX(canvasX: number): number {
    return canvasX * this.canvasService.zoom();
  }

  screenY(canvasY: number): number {
    return canvasY * this.canvasService.zoom();
  }

  toggleComment(event: Event, id: string): void {
    event.stopPropagation();
    this.activeComment.set(this.activeComment() === id ? null : id);
    this.replyText = '';
  }

  closeThread(): void {
    this.activeComment.set(null);
  }

  submitNewComment(): void {
    const text = this.newCommentText.trim();
    const x = this.newCommentX();
    const y = this.newCommentY();
    if (!text || x === null || y === null) return;

    this.commentsService.addComment(x, y, text);
    this.cancelNewComment();
  }

  cancelNewComment(): void {
    this.newCommentX.set(null);
    this.newCommentY.set(null);
    this.newCommentText = '';
  }

  onNewEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.shiftKey) return; // allow newline
    e.preventDefault();
    this.submitNewComment();
  }

  submitReply(commentId: string): void {
    const text = this.replyText.trim();
    if (!text) return;
    this.commentsService.addReply(commentId, text);
    this.replyText = '';
    this.closeMention();
  }

  // --- Mention autocomplete ---

  onReplyInput(event: Event, commentId: string): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const caret = input.selectionStart ?? value.length;

    // Find the @-trigger before the caret
    const upToCaret = value.substring(0, caret);
    const match = upToCaret.match(/(?:^|\s)@([\w-]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const users = this.knownUsers().filter(u => u.toLowerCase().includes(query));
      this.mentionTarget.set(commentId);
      this.mentionMatches.set(users.slice(0, 5));
      this.mentionIndex.set(0);
    } else {
      this.closeMention();
    }
  }

  onReplyKey(event: KeyboardEvent): void {
    if (this.mentionTarget()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.mentionIndex.update(i => Math.min(this.mentionMatches().length - 1, i + 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.mentionIndex.update(i => Math.max(0, i - 1));
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        const target = this.mentionTarget();
        const user = this.mentionMatches()[this.mentionIndex()];
        if (user && target) {
          event.preventDefault();
          this.pickMention(user, target);
          return;
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMention();
        return;
      }
    }

    // Otherwise normal Enter submits the reply
    if (event.key === 'Enter' && this.activeComment()) {
      this.submitReply(this.activeComment()!);
    }
  }

  pickMention(user: string, commentId: string): void {
    // Insert into replyText at the @ trigger
    this.replyText = this.replyText.replace(/@[\w-]*$/, `@${user} `);
    this.closeMention();
    // Refocus the input
    setTimeout(() => {
      const input = this.host.nativeElement.querySelector('.reply-input input') as HTMLInputElement;
      input?.focus();
    }, 0);
  }

  closeMention(): void {
    this.mentionTarget.set(null);
    this.mentionMatches.set([]);
  }

  /** Render @mentions as styled spans in display text. */
  formatMentions(text: string): string {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/@([\w-]+)/g, '<span class="mention">@$1</span>');
  }

  deleteComment(commentId: string): void {
    if (!confirm('Delete this comment thread?')) return;
    this.commentsService.deleteComment(commentId);
    this.activeComment.set(null);
  }
}
