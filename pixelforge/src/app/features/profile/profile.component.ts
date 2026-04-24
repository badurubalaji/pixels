import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

import { AuthService, AuthUser } from '../../core/services/auth.service';
import { UserMenuComponent } from '../../shared/components/user-menu.component';

/**
 * `/profile` — authenticated user's account overview.
 *
 * @remarks
 * Presents the signed-in user's identity and a primary sign-out action in a
 * layout consistent with `/auth`, `/hub`, and `/gallery` (PX-063/064/066).
 * Intentionally read-only for MVP — name editing, password rotation, and
 * avatar uploads are out of scope for PX-065 and would ship as their own
 * stories when the backend gains the corresponding endpoints.
 *
 * The page is guarded by `authGuard`; an unauthenticated user is bounced to
 * `/auth` before this component mounts. The defensive guest-branch below
 * only runs if AuthService is somehow cleared mid-session (edge case worth
 * handling so the view never paints a null-user skeleton).
 *
 * @see Story PX-065
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    RouterLink,
    UserMenuComponent,
  ],
  template: `
    <section class="profile" aria-labelledby="profile-heading">
      <div class="profile__bg" aria-hidden="true"></div>

      <header class="profile__header">
        <a
          class="profile__back"
          routerLink="/hub"
          aria-label="Back to hub"
          matRipple
        >
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          <span>Back to hub</span>
        </a>
        <app-user-menu />
      </header>

      @if (user(); as u) {
        <article class="profile__card">
          <div class="profile__card-head">
            <span class="profile__avatar" aria-hidden="true">{{ initials() }}</span>
            <div class="profile__head-copy">
              <p class="profile__eyebrow">
                <span class="profile__eyebrow-dot"></span>
                <span>Your account</span>
              </p>
              <h1 id="profile-heading" class="profile__title">
                {{ u.name || u.email.split('@')[0] }}
              </h1>
              <p class="profile__subtitle">{{ u.email }}</p>
            </div>
          </div>

          <dl class="profile__meta" role="list">
            <div class="profile__meta-row" role="listitem">
              <dt>Email</dt>
              <dd>{{ u.email }}</dd>
            </div>
            <div class="profile__meta-row" role="listitem">
              <dt>Display name</dt>
              <dd>{{ u.name || '—' }}</dd>
            </div>
            <div class="profile__meta-row" role="listitem">
              <dt>Member since</dt>
              <dd>{{ memberSince() }}</dd>
            </div>
            <div class="profile__meta-row" role="listitem">
              <dt>Account id</dt>
              <dd class="profile__meta-mono">{{ u.id }}</dd>
            </div>
          </dl>

          <div class="profile__actions">
            <button
              type="button"
              class="profile__signout"
              matRipple
              data-testid="profile-signout"
              (click)="onSignOut()"
              aria-label="Sign out"
            >
              <mat-icon aria-hidden="true">logout</mat-icon>
              <span>Sign out</span>
            </button>
            <a class="profile__ghost-link" routerLink="/hub">Continue to hub</a>
          </div>
        </article>
      } @else {
        <div class="profile__guest" role="status">
          <span class="profile__guest-glyph" aria-hidden="true">
            <mat-icon>account_circle</mat-icon>
          </span>
          <div class="profile__guest-body">
            <h1 id="profile-heading" class="profile__title">You're signed out</h1>
            <p class="profile__subtitle">Sign in to see your account details.</p>
            <a
              class="profile__signin"
              routerLink="/auth"
              aria-label="Sign in"
              matRipple
            >
              <mat-icon aria-hidden="true">login</mat-icon>
              <span>Sign in</span>
            </a>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
        color: var(--px-ink);
        background: var(--px-page);
      }

      .profile {
        position: relative;
        max-width: 840px;
        margin: 0 auto;
        padding: 48px 32px 80px;
      }

      .profile__bg {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image:
          radial-gradient(
            ellipse at 80% -10%,
            rgba(124, 58, 237, 0.12) 0%,
            transparent 45%
          ),
          radial-gradient(
            ellipse at -10% 110%,
            rgba(6, 182, 212, 0.10) 0%,
            transparent 45%
          ),
          radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0);
        background-size: auto, auto, 24px 24px;
      }
      .profile > *:not(.profile__bg) {
        position: relative;
        z-index: 1;
      }

      .profile__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 32px;
      }

      .profile__back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px 8px 10px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 999px;
        color: var(--px-ink-soft);
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
      }
      .profile__back:hover {
        border-color: rgba(124, 58, 237, 0.4);
        color: var(--px-ink);
        background: #fafafa;
      }
      .profile__back:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      .profile__back mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* ── Card ────────────────────────────────────────────────── */

      .profile__card {
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 20px;
        padding: 36px 32px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      }

      .profile__card-head {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 32px;
      }

      .profile__avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 60%, var(--px-cyan) 100%);
        color: #ffffff;
        font-size: 1.5rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28),
          0 6px 20px -8px rgba(124, 58, 237, 0.45);
        flex-shrink: 0;
      }

      .profile__head-copy {
        min-width: 0;
        flex: 1 1 auto;
      }

      .profile__eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 10px;
        padding: 5px 12px 5px 8px;
        background: #f8fafc;
        border: 1px solid var(--px-line);
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 500;
        color: var(--px-ink-soft);
      }
      .profile__eyebrow-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--px-violet), var(--px-cyan));
      }

      .profile__title {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--px-ink);
      }
      .profile__subtitle {
        margin: 6px 0 0;
        color: var(--px-muted);
        font-size: 0.95rem;
      }

      /* ── Meta rows ───────────────────────────────────────────── */

      .profile__meta {
        margin: 0 0 32px;
        padding: 0;
        border-top: 1px solid var(--px-line);
      }
      .profile__meta-row {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 24px;
        padding: 14px 0;
        border-bottom: 1px solid var(--px-line);
      }
      @media (max-width: 540px) {
        .profile__meta-row {
          grid-template-columns: 1fr;
          gap: 4px;
        }
      }
      .profile__meta-row dt {
        margin: 0;
        font-size: 0.82rem;
        font-weight: 500;
        color: var(--px-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .profile__meta-row dd {
        margin: 0;
        color: var(--px-ink);
        font-size: 0.95rem;
        word-break: break-word;
      }
      .profile__meta-mono {
        font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
        font-size: 0.85rem;
        color: var(--px-ink-soft);
      }

      /* ── Actions ─────────────────────────────────────────────── */

      .profile__actions {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .profile__signout {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 22px;
        background: #ffffff;
        color: #b91c1c;
        border: 1px solid #fecaca;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 600;
        transition: background 160ms ease, border-color 160ms ease,
          color 160ms ease, transform 160ms ease;
      }
      .profile__signout:hover {
        background: #fef2f2;
        border-color: #fca5a5;
        transform: translateY(-1px);
      }
      .profile__signout:focus-visible {
        outline: 3px solid rgba(185, 28, 28, 0.35);
        outline-offset: 3px;
      }
      .profile__signout mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .profile__ghost-link {
        color: var(--px-violet);
        font-weight: 500;
        text-decoration: none;
        padding: 10px 4px;
        font-size: 0.92rem;
      }
      .profile__ghost-link:hover { text-decoration: underline; }

      /* ── Guest fallback ──────────────────────────────────────── */

      .profile__guest {
        display: flex;
        gap: 20px;
        align-items: flex-start;
        padding: 32px;
        background: var(--px-surface);
        border: 1px dashed var(--px-line);
        border-radius: 18px;
      }
      .profile__guest-glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(6, 182, 212, 0.12));
        color: var(--px-violet);
        flex-shrink: 0;
      }
      .profile__guest-glyph mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .profile__guest-body { flex: 1 1 auto; min-width: 0; }

      .profile__signin {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 0 20px;
        min-height: 44px;
        background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 100%);
        color: #ffffff;
        border: none;
        border-radius: 12px;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
        box-shadow: 0 4px 14px rgba(124, 58, 237, 0.28);
      }
      .profile__signin mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      @media (prefers-reduced-motion: reduce) {
        .profile__signout, .profile__back { transition: none !important; }
        .profile__signout:hover { transform: none !important; }
      }

      @media (max-width: 560px) {
        .profile { padding: 32px 20px 64px; }
        .profile__card { padding: 28px 22px; }
        .profile__card-head { flex-direction: column; align-items: flex-start; }
      }
    `,
  ],
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Currently signed-in user (null if the session was cleared mid-render).
   *
   * @remarks
   * Pass-through of {@link AuthService.currentUser}. Normally non-null on
   * this route because `authGuard` blocks unauthenticated access.
   */
  readonly user = computed<AuthUser | null>(() => this.authService.currentUser());

  /**
   * Two-letter initials derived from the user's name (or email local-part).
   *
   * @returns Uppercased initials, or `"?"` when the user has neither a name
   *   nor a parseable email (shouldn't happen in practice).
   */
  readonly initials = computed<string>(() => {
    const u = this.user();
    if (!u) return '?';
    const source = (u.name || u.email.split('@')[0] || '').trim();
    if (!source) return '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  });

  /**
   * Human-friendly "member since" date.
   *
   * @returns A locale-formatted long date (e.g. `"April 24, 2026"`) when
   *   the user has a parseable `created_at`, or the literal string
   *   `"Unknown"` if the field is missing or unparseable.
   *
   * @remarks
   * Formatted once per user read via `computed`; inline `Intl.DateTimeFormat`
   * avoids pulling in a date library.
   */
  readonly memberSince = computed<string>(() => {
    const u = this.user();
    if (!u?.created_at) return 'Unknown';
    const t = Date.parse(u.created_at);
    if (Number.isNaN(t)) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
    }).format(new Date(t));
  });

  /**
   * Clear auth state and navigate back to `/auth`.
   *
   * @returns A promise that resolves once navigation settles.
   *
   * @remarks
   * Same contract as {@link UserMenuComponent.onSignOut} — kept local here
   * so the profile card's "Sign out" button works without reaching into
   * the user-menu dropdown.
   */
  async onSignOut(): Promise<boolean> {
    this.authService.logout();
    return this.router.navigate(['/auth']);
  }
}
