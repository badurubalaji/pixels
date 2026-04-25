import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  /**
   * Public URL of the user's avatar image, when one has been uploaded
   * via PX-073. `null` / undefined means no avatar — UI surfaces fall
   * back to the gradient initials chip.
   */
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'pixelforge_token';
const USER_KEY = 'pixelforge_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly _currentUser = signal<AuthUser | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  constructor() {
    this.loadFromStorage();
  }

  signup(email: string, password: string, name?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/signup`, {
      email,
      password,
      name,
    }).pipe(tap(res => this.setAuth(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, {
      email,
      password,
    }).pipe(tap(res => this.setAuth(res)));
  }

  logout(): void {
    this._currentUser.set(null);
    this._token.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Update the authenticated caller's own profile (PX-071).
   *
   * @param patch - Partial payload. Today only `name` is accepted; a `null`
   *   or empty string clears the display name (backend stores as null and
   *   consumers fall back to the email local-part).
   * @returns An `Observable<AuthUser>` that resolves with the post-update
   *   user record. On success, `currentUser()` and `localStorage` are both
   *   refreshed so guarded routes re-render with the new value immediately.
   *
   * @remarks
   * Wraps `PATCH /api/auth/me`. The request uses `withCredentials: false`
   * and relies on the bearer-token interceptor to attach the JWT. Errors
   * surface via the returned observable's error channel — callers decide
   * how to render them (e.g. inline form error vs. snackbar).
   */
  updateMe(patch: { name?: string | null }): Observable<AuthUser> {
    return this.http
      .patch<AuthUser>(`${this.baseUrl}/api/auth/me`, patch)
      .pipe(tap(user => this.setUserOnly(user)));
  }

  /**
   * Rotate the authenticated caller's password (PX-075).
   *
   * @param current - The current password (verified server-side against
   *   the stored bcrypt hash).
   * @param next - The new password (≥ 6 characters; must differ from
   *   the current).
   * @returns An `Observable<void>` that completes on HTTP 204. Errors
   *   surface via the observable's error channel — typical statuses:
   *   401 (`current` wrong), 400 (`next` too short or unchanged), 401
   *   (no/expired bearer).
   *
   * @remarks
   * Wraps `POST /api/auth/me/password`. The JWT does NOT change after a
   * password rotation, and `currentUser()` is unaffected — the caller
   * remains signed in on the same session.
   */
  changePassword(current: string, next: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/auth/me/password`, {
      current,
      next,
    });
  }

  /**
   * Upload (or replace) the authenticated caller's avatar (PX-073).
   *
   * @param file - A `File` from a `<input type="file">` change event.
   *   Must be `image/png`, `image/jpeg`, or `image/webp`, ≤ 1 MB.
   *   Anything else 400s server-side.
   * @returns An `Observable<AuthUser>` resolving with the post-upload
   *   user record (with `avatar_url` populated). On success, the
   *   `currentUser` signal + persisted user are refreshed atomically.
   *
   * @remarks
   * Wraps `POST /api/auth/me/avatar` as multipart. The interceptor
   * attaches the JWT; we do not set `Content-Type` ourselves — the
   * browser sets the correct multipart boundary automatically.
   */
  uploadAvatar(file: File): Observable<AuthUser> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<AuthUser>(`${this.baseUrl}/api/auth/me/avatar`, formData)
      .pipe(tap(user => this.setUserOnly(user)));
  }

  /**
   * Remove the authenticated caller's avatar (PX-073).
   *
   * @returns An `Observable<AuthUser>` resolving with the cleared user
   *   record (`avatar_url=null`). Idempotent — safe to call when no
   *   avatar is set.
   */
  deleteAvatar(): Observable<AuthUser> {
    return this.http
      .delete<AuthUser>(`${this.baseUrl}/api/auth/me/avatar`)
      .pipe(tap(user => this.setUserOnly(user)));
  }

  private setUserOnly(user: AuthUser): void {
    this._currentUser.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Resolve a user's avatar URL to a fully-qualified address suitable
   * for an `<img src>` (PX-073).
   *
   * @param user - Any `AuthUser`-shaped record (or null) — typically
   *   either `currentUser()` or another user pulled from a list.
   * @returns The absolute URL when the user has an avatar, otherwise
   *   `null`. Relative `/api/auth/avatar/{id}` URLs from the backend
   *   are prefixed with `environment.apiUrl` so they resolve against
   *   the API origin (FE may be on a different port in dev).
   *
   * @example
   * ```html
   * @if (authService.avatarSrc(user); as src) {
   *   <img [src]="src" alt="" />
   * }
   * ```
   */
  avatarSrc(user: { avatar_url?: string | null } | null | undefined): string | null {
    const url = user?.avatar_url;
    if (!url) return null;
    // Already absolute? — keep as-is.
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private setAuth(response: AuthResponse): void {
    this._currentUser.set(response.user);
    this._token.set(response.token);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (token && userStr) {
        this._token.set(token);
        this._currentUser.set(JSON.parse(userStr));
      }
    } catch {}
  }
}
