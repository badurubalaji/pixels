import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CommentsService } from './comments.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CommentsService,
        {
          provide: ApiService,
          useValue: {
            listComments: () => of([]),
            createComment: () => of({}),
            updateComment: () => of({}),
            deleteCommentRemote: () => of({}),
            addReply: () => of({}),
          },
        },
        {
          provide: AuthService,
          useValue: { currentUser: signal({ id: '1', email: 't@t.io', name: 'Tester' }) },
        },
      ],
    });
    service = TestBed.inject(CommentsService);
    service.setActiveProject('proj-1');
  });

  it('toggles comment mode', () => {
    expect(service.commentMode()).toBe(false);
    service.toggleCommentMode();
    expect(service.commentMode()).toBe(true);
    service.toggleCommentMode();
    expect(service.commentMode()).toBe(false);
  });

  it('adds a comment scoped to active project', () => {
    const c = service.addComment(100, 200, 'Great design!');
    expect(c.text).toBe('Great design!');
    expect(c.projectId).toBe('proj-1');
    expect(service.comments().length).toBe(1);
  });

  it('uses user name as default author', () => {
    const c = service.addComment(10, 10, 'Hi');
    expect(c.author).toBe('Tester');
  });

  it('toggles resolved state', () => {
    const c = service.addComment(0, 0, 'Needs fix');
    expect(c.resolved).toBe(false);
    service.toggleResolved(c.id);
    expect(service.comments().find(x => x.id === c.id)?.resolved).toBe(true);
  });

  it('adds a reply to a comment', () => {
    const c = service.addComment(0, 0, 'What about this?');
    service.addReply(c.id, 'Agreed!');
    expect(service.comments().find(x => x.id === c.id)?.replies.length).toBe(1);
  });

  it('deletes a comment', () => {
    const c = service.addComment(0, 0, 'Remove me');
    service.deleteComment(c.id);
    expect(service.comments().find(x => x.id === c.id)).toBeUndefined();
  });

  it('unresolved count excludes resolved', () => {
    const a = service.addComment(0, 0, 'A');
    service.addComment(0, 0, 'B');
    service.toggleResolved(a.id);
    expect(service.unresolvedCount()).toBe(1);
  });
});
