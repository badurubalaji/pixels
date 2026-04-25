import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
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
            <div class="profile__meta-row profile__meta-row--editable" role="listitem">
              <dt>Display name</dt>
              <dd>
                @if (editingName()) {
                  <form
                    class="profile__name-form"
                    (submit)="saveEditName($event)"
                    (reset)="cancelEditName($event)"
                  >
                    <mat-form-field appearance="outline" class="profile__name-field">
                      <mat-label>Display name</mat-label>
                      <input
                        #nameInput
                        matInput
                        [ngModel]="nameDraft()"
                        (ngModelChange)="nameDraft.set($event)"
                        name="displayName"
                        maxlength="60"
                        autocomplete="name"
                        data-testid="profile-name-input"
                      />
                      <mat-hint align="end">{{ nameDraft().length }}/60</mat-hint>
                    </mat-form-field>
                    @if (nameError(); as err) {
                      <p class="profile__name-error" role="alert">{{ err }}</p>
                    }
                    <div class="profile__name-actions">
                      <button
                        type="submit"
                        class="profile__name-save"
                        [disabled]="savingName() || !nameDirty()"
                        data-testid="profile-name-save"
                      >
                        @if (savingName()) {
                          <mat-spinner diameter="16"></mat-spinner>
                        } @else {
                          <span>Save</span>
                        }
                      </button>
                      <button
                        type="reset"
                        class="profile__name-cancel"
                        [disabled]="savingName()"
                        data-testid="profile-name-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                } @else {
                  <span class="profile__name-display">{{ u.name || '—' }}</span>
                  <button
                    type="button"
                    class="profile__name-edit"
                    matRipple
                    aria-label="Edit display name"
                    data-testid="profile-name-edit"
                    (click)="startEditName()"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                }
              </dd>
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

          <section class="profile__security" aria-labelledby="profile-security-heading">
            <div class="profile__security-head">
              <h3 id="profile-security-heading" class="profile__security-title">Security</h3>
              @if (!changingPwd()) {
                <button
                  type="button"
                  class="profile__security-trigger"
                  matRipple
                  data-testid="profile-pwd-trigger"
                  (click)="startChangePwd()"
                >
                  <mat-icon aria-hidden="true">lock_reset</mat-icon>
                  <span>Change password</span>
                </button>
              }
            </div>

            @if (changingPwd()) {
              <form
                class="profile__pwd-form"
                (submit)="saveChangePwd($event)"
                (reset)="cancelChangePwd($event)"
              >
                <mat-form-field appearance="outline" class="profile__pwd-field">
                  <mat-label>Current password</mat-label>
                  <input
                    matInput
                    type="password"
                    autocomplete="current-password"
                    [ngModel]="pwdCurrent()"
                    (ngModelChange)="pwdCurrent.set($event)"
                    name="currentPassword"
                    required
                    data-testid="profile-pwd-current"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" class="profile__pwd-field">
                  <mat-label>New password</mat-label>
                  <input
                    matInput
                    type="password"
                    autocomplete="new-password"
                    [ngModel]="pwdNext()"
                    (ngModelChange)="pwdNext.set($event)"
                    name="newPassword"
                    minlength="6"
                    required
                    data-testid="profile-pwd-next"
                  />
                  <mat-hint>At least 6 characters, different from current</mat-hint>
                </mat-form-field>

                @if (pwdError(); as err) {
                  <p class="profile__name-error" role="alert">{{ err }}</p>
                }
                @if (pwdSuccess()) {
                  <p class="profile__pwd-success" role="status">
                    <mat-icon aria-hidden="true">check_circle</mat-icon>
                    Password updated.
                  </p>
                }

                <div class="profile__name-actions">
                  <button
                    type="submit"
                    class="profile__name-save"
                    [disabled]="pwdSaving() || !pwdReady()"
                    data-testid="profile-pwd-save"
                  >
                    @if (pwdSaving()) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <span>Update password</span>
                    }
                  </button>
                  <button
                    type="reset"
                    class="profile__name-cancel"
                    [disabled]="pwdSaving()"
                    data-testid="profile-pwd-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            }
          </section>

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
      .profile__meta-row--editable dd {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 40px;
      }

      .profile__name-display { flex: 1 1 auto; }
      .profile__name-edit {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        color: var(--px-ink-soft);
        cursor: pointer;
        transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
      }
      .profile__name-edit:hover {
        border-color: rgba(124, 58, 237, 0.4);
        color: var(--px-violet);
        background: rgba(124, 58, 237, 0.06);
      }
      .profile__name-edit:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      .profile__name-edit mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .profile__name-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }
      .profile__name-field {
        width: 100%;
        max-width: 360px;
      }
      .profile__name-field ::ng-deep .mdc-text-field--focused .mdc-notched-outline > * {
        border-color: var(--px-violet) !important;
      }
      .profile__name-field ::ng-deep .mdc-floating-label--float-above.mdc-floating-label {
        color: var(--px-violet) !important;
      }

      .profile__name-error {
        margin: 0;
        padding: 8px 12px;
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
        border-radius: 8px;
        font-size: 0.85rem;
        max-width: 360px;
      }

      .profile__name-actions {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .profile__name-save {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 18px;
        background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 100%);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
      }
      .profile__name-save:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 14px rgba(124, 58, 237, 0.32);
        filter: brightness(1.05);
      }
      .profile__name-save:disabled {
        background: #e2e8f0;
        color: #94a3b8;
        cursor: not-allowed;
      }
      .profile__name-save ::ng-deep .mat-mdc-progress-spinner circle { stroke: #ffffff; }

      .profile__name-cancel {
        display: inline-flex;
        align-items: center;
        padding: 0 14px;
        min-height: 36px;
        background: transparent;
        border: 1px solid var(--px-line);
        border-radius: 10px;
        color: var(--px-ink-soft);
        font-size: 0.88rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease;
      }
      .profile__name-cancel:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
      .profile__name-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

      /* ── Security section (PX-075) ─────────────────────────────── */

      .profile__security {
        margin: 28px 0 24px;
        padding: 22px 22px 18px;
        background: #f8fafc;
        border: 1px solid var(--px-line);
        border-radius: 14px;
      }
      .profile__security-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .profile__security-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--px-ink);
        letter-spacing: -0.005em;
      }
      .profile__security-trigger {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px 8px 12px;
        background: var(--px-surface);
        color: var(--px-ink-soft);
        border: 1px solid var(--px-line);
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
      }
      .profile__security-trigger:hover {
        border-color: rgba(124, 58, 237, 0.4);
        color: var(--px-violet);
        background: rgba(124, 58, 237, 0.06);
      }
      .profile__security-trigger:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }
      .profile__security-trigger mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .profile__pwd-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 16px;
      }
      .profile__pwd-field {
        width: 100%;
        max-width: 380px;
      }
      .profile__pwd-field ::ng-deep .mdc-text-field--focused .mdc-notched-outline > * {
        border-color: var(--px-violet) !important;
      }
      .profile__pwd-field ::ng-deep .mdc-floating-label--float-above.mdc-floating-label {
        color: var(--px-violet) !important;
      }

      .profile__pwd-success {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 4px 0 8px;
        padding: 8px 12px;
        background: #ecfdf5;
        color: #047857;
        border: 1px solid #a7f3d0;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
      }
      .profile__pwd-success mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #059669;
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

  // ────────────────────────────────────────────────────────────────
  //  PX-071 — inline display-name edit
  // ────────────────────────────────────────────────────────────────

  /** `true` while the display-name field is in edit mode. */
  readonly editingName = signal<boolean>(false);
  /** Current draft value of the name input. */
  readonly nameDraft = signal<string>('');
  /** `true` while a PATCH is in flight. */
  readonly savingName = signal<boolean>(false);
  /** Inline error surfaced below the name input (empty = no error). */
  readonly nameError = signal<string>('');

  /**
   * `true` when the draft differs from the persisted value — enables Save.
   *
   * @remarks
   * Trims both sides so pure-whitespace edits (e.g. adding trailing spaces)
   * don't light up the Save button.
   */
  readonly nameDirty = computed<boolean>(() => {
    const u = this.user();
    const current = (u?.name ?? '').trim();
    const draft = this.nameDraft().trim();
    return draft !== current;
  });

  /**
   * Enter display-name edit mode and seed the draft from the current value.
   *
   * @remarks
   * The template's `#nameInput` is focused implicitly on the next paint by
   * Angular Material's `mat-form-field` — no manual focus call needed in
   * test harnesses.
   */
  startEditName(): void {
    this.nameDraft.set(this.user()?.name ?? '');
    this.nameError.set('');
    this.editingName.set(true);
  }

  /**
   * Exit edit mode without persisting. Also suppresses any in-progress
   * form submission caused by the reset button living inside the form.
   *
   * @param event - Optional DOM event (form `reset` or button click).
   */
  cancelEditName(event?: Event): void {
    event?.preventDefault();
    this.editingName.set(false);
    this.nameError.set('');
    this.savingName.set(false);
  }

  /**
   * Persist the draft name via `AuthService.updateMe` and exit edit mode
   * on success.
   *
   * @param event - The form `submit` DOM event; default action suppressed.
   *
   * @remarks
   * The empty-string branch is sent as `""` — the backend normalizes it
   * to `null` server-side (see `update_me` in `auth_routes.py`). This
   * means "clear the display name" is user-reachable by erasing the
   * field and pressing Save.
   */
  saveEditName(event?: Event): void {
    event?.preventDefault();
    if (this.savingName()) return;
    const draft = this.nameDraft().trim();

    this.savingName.set(true);
    this.nameError.set('');

    this.authService.updateMe({ name: draft || null }).subscribe({
      next: () => {
        this.savingName.set(false);
        this.editingName.set(false);
      },
      error: (err: unknown) => {
        this.savingName.set(false);
        const detail = this.extractErrorDetail(err);
        this.nameError.set(detail || 'Could not save — please try again.');
      },
    });
  }

  /**
   * Best-effort detail extractor for HttpErrorResponse-like values.
   *
   * @param err - Any error surfaced from the `updateMe` observable.
   * @returns A single readable sentence, or empty string when nothing
   *   useful can be pulled from the payload.
   */
  private extractErrorDetail(err: unknown): string {
    const anyErr = err as { error?: { detail?: unknown } };
    const d = anyErr?.error?.detail;
    if (typeof d === 'string' && d.trim()) return d;
    if (Array.isArray(d) && d.length > 0) {
      const first = d[0] as { msg?: unknown };
      if (typeof first?.msg === 'string') return first.msg;
    }
    return '';
  }

  // ────────────────────────────────────────────────────────────────
  //  PX-075 — change password
  // ────────────────────────────────────────────────────────────────

  /** `true` while the change-password section is expanded. */
  readonly changingPwd = signal<boolean>(false);
  /** Current-password field value. */
  readonly pwdCurrent = signal<string>('');
  /** New-password field value. */
  readonly pwdNext = signal<string>('');
  /** `true` while a `POST /api/auth/me/password` is in flight. */
  readonly pwdSaving = signal<boolean>(false);
  /** Inline error surfaced under the form (empty = no error). */
  readonly pwdError = signal<string>('');
  /** Briefly `true` after a successful rotation to show a confirmation pill. */
  readonly pwdSuccess = signal<boolean>(false);

  /**
   * `true` when both fields are filled and `next` is at least 6 chars —
   * gates the Save button so the disabled state matches the backend's
   * minimum-length contract.
   *
   * @returns `boolean` — `true` only when the form would plausibly succeed.
   */
  readonly pwdReady = computed<boolean>(() => {
    return this.pwdCurrent().length > 0 && this.pwdNext().length >= 6;
  });

  /**
   * Open the change-password section and clear any prior state.
   *
   * @remarks
   * Resets all four signals so a previous error or success message
   * does not leak into the fresh attempt.
   */
  startChangePwd(): void {
    this.pwdCurrent.set('');
    this.pwdNext.set('');
    this.pwdError.set('');
    this.pwdSuccess.set(false);
    this.changingPwd.set(true);
  }

  /**
   * Close the change-password section without persisting.
   *
   * @param event - Optional DOM event (form `reset` or button click).
   */
  cancelChangePwd(event?: Event): void {
    event?.preventDefault();
    this.changingPwd.set(false);
    this.pwdCurrent.set('');
    this.pwdNext.set('');
    this.pwdError.set('');
    this.pwdSuccess.set(false);
    this.pwdSaving.set(false);
  }

  /**
   * Submit the password rotation. On success: clears the inputs and
   * briefly surfaces a "Password updated" confirmation. On failure:
   * surfaces the backend detail (or a generic message) inline.
   *
   * @param event - The form `submit` DOM event; default action suppressed.
   *
   * @remarks
   * Stays in edit mode on failure so the user can correct and retry.
   * On success the form collapses back to the trigger button after
   * the success pill flashes.
   */
  saveChangePwd(event?: Event): void {
    event?.preventDefault();
    if (this.pwdSaving() || !this.pwdReady()) return;

    this.pwdSaving.set(true);
    this.pwdError.set('');
    this.pwdSuccess.set(false);

    this.authService
      .changePassword(this.pwdCurrent(), this.pwdNext())
      .subscribe({
        next: () => {
          this.pwdSaving.set(false);
          this.pwdSuccess.set(true);
          this.pwdCurrent.set('');
          this.pwdNext.set('');
        },
        error: (err: unknown) => {
          this.pwdSaving.set(false);
          const detail = this.extractErrorDetail(err);
          this.pwdError.set(detail || 'Could not update password — please try again.');
        },
      });
  }
}
