import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Reply {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: string;
  resolved: boolean;
  replies: Reply[];
}

const STORAGE_KEY = 'pixelforge_comments';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly _allComments = signal<Comment[]>([]);
  private readonly _activeProjectId = signal<string | null>(null);
  private readonly _commentMode = signal(false);

  readonly commentMode = this._commentMode.asReadonly();
  readonly comments = computed(() => {
    const pid = this._activeProjectId();
    if (!pid) return [];
    return this._allComments().filter(c => c.projectId === pid);
  });

  readonly unresolvedCount = computed(() => this.comments().filter(c => !c.resolved).length);

  constructor() {
    this.load();
  }

  setActiveProject(projectId: string | null): void {
    this._activeProjectId.set(projectId);
    if (projectId) {
      // Pull comments from backend for this project
      this.apiService.listComments(projectId).subscribe({
        next: (remote) => {
          // Merge: replace local comments for this project with remote
          const others = this._allComments().filter(c => c.projectId !== projectId);
          this._allComments.set([...others, ...remote]);
          this.persist();
        },
      });
    }
  }

  toggleCommentMode(): void {
    this._commentMode.update(v => !v);
  }

  setCommentMode(value: boolean): void {
    this._commentMode.set(value);
  }

  addComment(x: number, y: number, text: string, author?: string): Comment {
    const projectId = this._activeProjectId();
    if (!projectId) throw new Error('No active project');

    const user = this.authService.currentUser();
    const finalAuthor = author || user?.name || user?.email || 'You';

    const comment: Comment = {
      id: crypto.randomUUID(),
      projectId,
      x, y, text, author: finalAuthor,
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    this._allComments.update(c => [...c, comment]);
    this.persist();

    // Sync to backend
    this.apiService.createComment(projectId, { x, y, text, author: finalAuthor }).subscribe({
      next: (remote) => {
        // Only replace if remote looks like a valid comment
        if (!remote || typeof remote !== 'object' || !(remote as any).id) return;
        this._allComments.update(comments =>
          comments.map(c => c.id === comment.id ? (remote as Comment) : c)
        );
        this.persist();
      },
      error: () => {},
    });

    return comment;
  }

  addReply(commentId: string, text: string, author?: string): void {
    const projectId = this._activeProjectId();
    const user = this.authService.currentUser();
    const finalAuthor = author || user?.name || user?.email || 'You';

    const reply: Reply = {
      id: crypto.randomUUID(),
      text, author: finalAuthor,
      createdAt: new Date().toISOString(),
    };

    this._allComments.update(comments =>
      comments.map(c => c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c)
    );
    this.persist();

    if (projectId) {
      this.apiService.addReply(projectId, commentId, { text, author: finalAuthor }).subscribe({
        error: () => {},
      });
    }
  }

  toggleResolved(commentId: string): void {
    const projectId = this._activeProjectId();
    let nextResolved = false;
    this._allComments.update(comments =>
      comments.map(c => {
        if (c.id === commentId) {
          nextResolved = !c.resolved;
          return { ...c, resolved: nextResolved };
        }
        return c;
      })
    );
    this.persist();

    if (projectId) {
      this.apiService.updateComment(projectId, commentId, { resolved: nextResolved }).subscribe({
        error: () => {},
      });
    }
  }

  deleteComment(commentId: string): void {
    const projectId = this._activeProjectId();
    this._allComments.update(c => c.filter(x => x.id !== commentId));
    this.persist();

    if (projectId) {
      this.apiService.deleteCommentRemote(projectId, commentId).subscribe({ error: () => {} });
    }
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) this._allComments.set(JSON.parse(stored));
    } catch {}
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._allComments()));
    } catch {}
  }
}
