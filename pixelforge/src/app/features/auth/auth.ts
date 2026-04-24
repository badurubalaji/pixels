import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-shell">
      <aside class="auth-hero" aria-hidden="true">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="hero-grid"></div>

        <div class="hero-content">
          <div class="wordmark">
            <span class="wordmark-glyph">
              <mat-icon>palette</mat-icon>
            </span>
            <span class="wordmark-text">Pixelforge</span>
          </div>

          <h1 class="hero-tagline">
            Design anything.<br />
            <span class="hero-accent">Ship anywhere.</span>
          </h1>

          <p class="hero-sub">
            The fastest way to turn your brand into Instagram posts,
            LinkedIn banners, and YouTube thumbnails that actually ship.
          </p>

          <ul class="value-props">
            <li>
              <span class="vp-icon"><mat-icon>bolt</mat-icon></span>
              <span class="vp-text">Create in minutes, not hours</span>
            </li>
            <li>
              <span class="vp-icon"><mat-icon>palette</mat-icon></span>
              <span class="vp-text">Apply your Brand Kit with one click</span>
            </li>
            <li>
              <span class="vp-icon"><mat-icon>ios_share</mat-icon></span>
              <span class="vp-text">Export for every platform natively</span>
            </li>
          </ul>
        </div>
      </aside>

      <section class="auth-form-panel">
        <div class="form-wrap">
          <div class="form-brand">
            <mat-icon class="form-brand-icon">palette</mat-icon>
            <span>Pixelforge</span>
          </div>

          <h2 class="form-heading">
            {{ mode() === 'login' ? 'Welcome back' : 'Get started' }}
          </h2>
          <p class="form-sub">
            {{
              mode() === 'login'
                ? 'Sign in to continue creating.'
                : 'Create a free account — no credit card required.'
            }}
          </p>

          <div class="pill-tabs" role="tablist" aria-label="Authentication mode">
            <button
              role="tab"
              type="button"
              class="pill-tab"
              [class.active]="mode() === 'login'"
              [attr.aria-selected]="mode() === 'login'"
              (click)="mode.set('login'); error.set('')"
            >
              Log In
            </button>
            <button
              role="tab"
              type="button"
              class="pill-tab"
              [class.active]="mode() === 'signup'"
              [attr.aria-selected]="mode() === 'signup'"
              (click)="mode.set('signup'); error.set('')"
            >
              Sign Up
            </button>
          </div>

          <form class="auth-form" (submit)="submit($event)">
            @if (mode() === 'signup') {
              <mat-form-field appearance="outline" class="auth-field">
                <mat-label>Name (optional)</mat-label>
                <input
                  matInput
                  [ngModel]="name()"
                  (ngModelChange)="name.set($event)"
                  name="name"
                />
              </mat-form-field>
            }

            <mat-form-field appearance="outline" class="auth-field">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                autocomplete="email"
                [ngModel]="email()"
                (ngModelChange)="email.set($event)"
                name="email"
                required
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="auth-field">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="passwordVisible() ? 'text' : 'password'"
                [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
                [ngModel]="password()"
                (ngModelChange)="password.set($event)"
                name="password"
                required
                minlength="6"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                class="password-toggle"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'"
                [attr.aria-pressed]="passwordVisible()"
              >
                <mat-icon>{{ passwordVisible() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (mode() === 'signup') {
                <mat-hint>At least 6 characters</mat-hint>
              }
            </mat-form-field>

            @if (error(); as err) {
              <div class="error-msg" role="alert" aria-live="polite">
                <mat-icon>error_outline</mat-icon>
                <span>{{ err }}</span>
              </div>
            }

            <button
              mat-flat-button
              type="submit"
              class="submit-btn"
              [disabled]="loading() || !email() || !password()"
            >
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <span>{{ mode() === 'login' ? 'Log In' : 'Create account' }}</span>
                <mat-icon class="submit-arrow">arrow_forward</mat-icon>
              }
            </button>
          </form>

          <div class="divider"><span>or</span></div>

          <button mat-stroked-button class="skip-btn" (click)="continueAsGuest()">
            <mat-icon>person_outline</mat-icon>
            <span>Continue as guest</span>
          </button>

          <p class="legal">
            By continuing you agree to our Terms of Service &amp; Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      /* --px-ink-soft is locally overridden to a deeper slate because the
         auth form sits over a dark hero, where the default #334155 looks
         muddy against the white form panel's adjacent gradient glow. */
      --px-ink-soft: #1e293b;
      display: block;
      height: 100%;
      overflow-y: auto;
    }

    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      background: #fafafa;
    }

    @media (max-width: 960px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
    }

    /* ─── Hero (left panel) ───────────────────────────────────── */

    .auth-hero {
      position: relative;
      overflow: hidden;
      color: white;
      padding: 64px 56px;
      background:
        radial-gradient(ellipse at 20% 10%, rgba(236, 72, 153, 0.35), transparent 55%),
        radial-gradient(ellipse at 90% 90%, rgba(6, 182, 212, 0.35), transparent 50%),
        linear-gradient(135deg, var(--px-violet-deep) 0%, var(--px-violet) 55%, #3b0764 100%);
      display: flex;
      align-items: center;
      min-height: 100vh;
    }

    @media (max-width: 960px) {
      .auth-hero {
        min-height: 280px;
        padding: 40px 32px;
      }
    }

    .hero-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6), transparent 70%);
      pointer-events: none;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0.6;
      pointer-events: none;
      will-change: transform;
    }
    .blob-1 {
      width: 420px; height: 420px;
      background: var(--px-cyan);
      top: -120px; left: -120px;
      animation: drift-a 18s ease-in-out infinite alternate;
    }
    .blob-2 {
      width: 360px; height: 360px;
      background: var(--px-pink);
      bottom: -100px; right: -80px;
      animation: drift-b 22s ease-in-out infinite alternate;
    }
    .blob-3 {
      width: 280px; height: 280px;
      background: #a78bfa;
      top: 40%; left: 45%;
      opacity: 0.35;
      animation: drift-c 26s ease-in-out infinite alternate;
    }

    @keyframes drift-a {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(80px, 60px) scale(1.15); }
    }
    @keyframes drift-b {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-60px, -50px) scale(1.1); }
    }
    @keyframes drift-c {
      0%   { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-40px, 30px) scale(0.9); }
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 520px;
    }

    .wordmark {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 56px;
    }
    .wordmark-glyph {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(12px);
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.22);
    }
    .wordmark-glyph mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .wordmark-text {
      font-size: 1.15rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    @media (max-width: 960px) {
      .wordmark { margin-bottom: 20px; }
    }

    .hero-tagline {
      margin: 0 0 20px;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.02em;
    }
    .hero-accent {
      background: linear-gradient(90deg, #f0abfc 0%, #67e8f9 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .hero-sub {
      margin: 0 0 40px;
      font-size: 1.05rem;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.78);
      max-width: 440px;
    }

    @media (max-width: 960px) {
      .hero-sub { display: none; }
      .hero-tagline { font-size: 1.5rem; margin-bottom: 0; }
    }

    .value-props {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .value-props li {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.9);
    }
    .vp-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .vp-icon mat-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: #ddd6fe;
    }

    @media (max-width: 960px) {
      .value-props { display: none; }
    }

    /* ─── Form panel (right) ──────────────────────────────────── */

    .auth-form-panel {
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
      min-height: 100vh;
    }

    @media (max-width: 960px) {
      .auth-form-panel { padding: 32px 24px; min-height: unset; }
    }

    .form-wrap {
      width: 100%;
      max-width: 420px;
    }

    .form-brand {
      display: none;
    }
    @media (max-width: 960px) {
      .form-brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
        font-weight: 600;
        color: var(--px-ink);
      }
      .form-brand-icon {
        color: var(--px-violet);
      }
    }

    .form-heading {
      margin: 0 0 6px;
      font-size: 2rem;
      font-weight: 700;
      color: var(--px-ink);
      letter-spacing: -0.02em;
    }
    .form-sub {
      margin: 0 0 32px;
      color: #64748b;
      font-size: 0.95rem;
    }

    .pill-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 4px;
      background: #f1f5f9;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .pill-tab {
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
      transition: all 180ms ease;
    }
    .pill-tab.active {
      background: #ffffff;
      color: var(--px-ink);
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04);
    }
    .pill-tab:not(.active):hover {
      color: var(--px-ink);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .auth-field {
      width: 100%;
    }

    /* Brand-accent focus glow on the outline field — scoped via ::ng-deep
       because Material renders the outline in a shadow-adjacent subtree. */
    .auth-field ::ng-deep .mdc-text-field--focused .mdc-notched-outline > * {
      border-color: var(--px-violet) !important;
    }
    .auth-field ::ng-deep .mdc-text-field--focused .mat-mdc-form-field-focus-overlay {
      opacity: 0;
    }
    .auth-field ::ng-deep .mdc-floating-label--float-above.mdc-floating-label {
      color: var(--px-violet) !important;
    }

    .password-toggle {
      color: #94a3b8;
    }
    .password-toggle:hover {
      color: var(--px-violet);
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      margin: 8px 0 16px;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .error-msg mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      flex-shrink: 0;
    }

    .submit-btn {
      height: 48px;
      margin-top: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 100%) !important;
      color: #ffffff !important;
      border-radius: 10px !important;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.28);
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .submit-btn:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(124, 58, 237, 0.36);
      filter: brightness(1.05);
    }
    .submit-btn:disabled {
      background: #e2e8f0 !important;
      color: #94a3b8 !important;
      box-shadow: none;
    }
    .submit-arrow {
      font-size: 18px;
      height: 18px;
      width: 18px;
      transition: transform 160ms ease;
    }
    .submit-btn:not(:disabled):hover .submit-arrow {
      transform: translateX(3px);
    }
    .submit-btn ::ng-deep .mat-mdc-progress-spinner circle {
      stroke: #ffffff;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 24px 0 16px;
      color: #94a3b8;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }

    .skip-btn {
      width: 100%;
      height: 44px;
      border-radius: 10px !important;
      border: 1px solid #e2e8f0 !important;
      color: var(--px-ink) !important;
      font-weight: 500;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .skip-btn mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    .skip-btn:hover {
      background: #f8fafc !important;
      border-color: #cbd5e1 !important;
    }

    .legal {
      margin: 24px 0 0;
      text-align: center;
      font-size: 0.78rem;
      color: #94a3b8;
      line-height: 1.5;
    }

    @media (prefers-reduced-motion: reduce) {
      .blob { animation: none !important; }
      .submit-btn, .submit-arrow, .pill-tab { transition: none !important; }
    }
  `],
})
export class AuthComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'signup'>('login');
  readonly email = signal('');
  readonly password = signal('');
  readonly name = signal('');
  readonly loading = signal(false);
  readonly error = signal('');

  /**
   * Controls whether the password input renders as plain text (`true`) or
   * masked (`false`). Driven by the trailing eye-icon button on the password
   * `mat-form-field`.
   *
   * @remarks
   * Defaults to `false` (masked) so a shoulder-surfing attacker can't read a
   * password that's already been typed when the page first paints. Toggled
   * by {@link togglePasswordVisibility}.
   */
  readonly passwordVisible = signal(false);

  /**
   * Flip the password input between masked and plain-text rendering.
   *
   * @returns void. Mutates {@link passwordVisible} in place so the bound
   *   `input[type]` and the trailing icon update immediately.
   *
   * @remarks
   * Only affects the local DOM rendering — the `password` signal's value is
   * untouched, so submit-flow semantics are unchanged. The toggle button is
   * `type="button"` so a click does not submit the auth form.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.update(v => !v);
  }

  /**
   * Submit the login/signup form.
   *
   * @param event - The form-submit DOM event; the default action is suppressed.
   * @returns void. On success, navigates the router to `/hub` (PX-011 AC-1 / AC-2).
   *
   * @remarks
   * Delegates to {@link AuthService.login} or {@link AuthService.signup} based
   * on `mode()`. Failures surface via the `error()` signal; success flips
   * `loading()` off and routes the user to the content hub.
   *
   * @see PX-011
   */
  submit(event: Event): void {
    event.preventDefault();
    this.loading.set(true);
    this.error.set('');

    const onSuccess = () => {
      this.loading.set(false);
      // PX-011 AC-1/AC-2: default post-auth landing is /hub.
      this.router.navigate(['/hub']);
    };

    const onError = (err: any) => {
      this.loading.set(false);
      this.error.set(this.formatErrorDetail(err));
    };

    if (this.mode() === 'login') {
      this.authService.login(this.email(), this.password()).subscribe({
        next: onSuccess,
        error: onError,
      });
    } else {
      this.authService.signup(this.email(), this.password(), this.name()).subscribe({
        next: onSuccess,
        error: onError,
      });
    }
  }

  /**
   * Normalize a backend error payload into a single human-readable string
   * suitable for rendering inside the form-level error banner.
   *
   * @param err - The HttpErrorResponse-like object surfaced by
   *   `AuthService.login` / `AuthService.signup` subscribers. May contain:
   *   - `err.error.detail` as a string (FastAPI HTTPException), OR
   *   - `err.error.detail` as an array of Pydantic `ValidationError` records
   *     (`{loc, msg, type, ...}`), OR
   *   - nothing usable (network failure, upstream error).
   * @returns A single sentence describing the first validation failure, or
   *   the string `"Something went wrong"` when no detail can be recovered.
   *
   * @remarks
   * Pydantic v2 returns 422 with `detail` as an **array**. Stringifying the
   * array directly ("`[object Object]`") gave users zero signal when an
   * email failed EmailStr checks. We now pull the first item's `.msg` and
   * prefix it with the field name from `.loc[-1]` so the user sees
   * something like `"email: value is not a valid email address: ..."`.
   *
   * Kept defensive — a malformed payload falls through to the generic
   * "Something went wrong" fallback rather than surfacing stack traces.
   *
   * @see Story PX-061 (form error UX polish).
   */
  private formatErrorDetail(err: any): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      const msg = typeof first?.msg === 'string' ? first.msg : '';
      const loc = Array.isArray(first?.loc) ? first.loc : [];
      const field = loc.length > 0 ? String(loc[loc.length - 1]) : '';
      if (msg && field) return `${field}: ${msg}`;
      if (msg) return msg;
    }
    return 'Something went wrong';
  }

  /**
   * Skip auth and continue as a guest.
   *
   * @returns void. Navigates the router to `/hub` (PX-011 AC-6).
   *
   * @remarks
   * No token is set — downstream auth-guarded routes will still redirect to
   * `/auth`. Guest mode is a pure UI convenience; project-persistence is
   * local-storage only.
   *
   * @see PX-011 AC-6
   */
  continueAsGuest(): void {
    // PX-011 AC-6: guest lands on /hub.
    this.router.navigate(['/hub']);
  }
}
