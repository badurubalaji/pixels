import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * PX-011 AC-5 coverage: authGuard allows authenticated users and redirects
 * unauthenticated users to `/auth`.
 */
describe('authGuard — PX-011 AC-5', () => {
  /**
   * Minimal stand-in for {@link AuthService.isAuthenticated} — only the signal
   * accessor is ever read from the guard.
   */
  class FakeAuthService {
    private _authed = false;

    isAuthenticated(): boolean {
      return this._authed;
    }

    setAuthenticated(v: boolean): void {
      this._authed = v;
    }
  }

  let auth: FakeAuthService;

  beforeEach(() => {
    auth = new FakeAuthService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  const runGuard = (): boolean | UrlTree => {
    return TestBed.runInInjectionContext(() => {
      const result = authGuard(null as never, null as never);
      // authGuard is synchronous — narrow away the Observable/Promise branches.
      return result as boolean | UrlTree;
    });
  };

  it('returns true when the user is authenticated', () => {
    auth.setAuthenticated(true);
    const result = runGuard();
    expect(result).toBe(true);
  });

  it('returns a UrlTree for /auth when the user is unauthenticated', () => {
    auth.setAuthenticated(false);
    const result = runGuard();
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/auth');
  });
});
