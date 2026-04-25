import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
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

  private setUserOnly(user: AuthUser): void {
    this._currentUser.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
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
