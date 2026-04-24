import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';

import { AuthService, AuthUser } from '../../core/services/auth.service';

/**
 * Account chip + dropdown menu rendered in the top-right of authenticated routes.
 *
 * @remarks
 * Presents the signed-in user as a circular avatar chip with their initials
 * (derived from {@link AuthUser.name} or the local-part of the email),
 * and opens a MatMenu on click with two items:
 *
 *   1. **Profile** — navigates to `/profile`.
 *   2. **Sign out** — clears the auth state via {@link AuthService.logout}
 *      and routes to `/auth`.
 *
 * When no user is signed in (guest mode or a transient pre-bootstrap render)
 * the component falls back to a simple "Sign in" pill link. This keeps the
 * same slot filled on every surface — no layout shift — and gives guests an
 * explicit entry point to authentication.
 *
 * Scope: purely presentational. All state reads are signal-derived from
 * {@link AuthService}; no local state, no effects. Designed to be dropped
 * into any route's top-right chrome.
 *
 * @example
 * ```html
 * <app-user-menu />
 * ```
 *
 * @see Story PX-065
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatRippleModule,
    RouterLink,
  ],
  template: `
    @if (user(); as u) {
      <button
        type="button"
        class="user-menu__trigger"
        matRipple
        [matMenuTriggerFor]="menu"
        [attr.aria-label]="'Open user menu for ' + (u.name || u.email)"
      >
        <span class="user-menu__avatar" aria-hidden="true">{{ initials() }}</span>
        <span class="user-menu__identity">
          <span class="user-menu__name">{{ u.name || u.email.split('@')[0] }}</span>
          <span class="user-menu__email">{{ u.email }}</span>
        </span>
        <mat-icon class="user-menu__chev" aria-hidden="true">expand_more</mat-icon>
      </button>

      <mat-menu #menu="matMenu" class="user-menu__panel" xPosition="before">
        <div class="user-menu__panel-head" aria-hidden="true">
          <span class="user-menu__avatar user-menu__avatar--big">{{ initials() }}</span>
          <span class="user-menu__panel-identity">
            <span class="user-menu__name">{{ u.name || u.email.split('@')[0] }}</span>
            <span class="user-menu__email">{{ u.email }}</span>
          </span>
        </div>
        <hr class="user-menu__divider" />
        <button mat-menu-item routerLink="/profile" data-testid="user-menu-profile">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item routerLink="/hub" data-testid="user-menu-hub">
          <mat-icon>home</mat-icon>
          <span>Hub</span>
        </button>
        <hr class="user-menu__divider" />
        <button
          mat-menu-item
          class="user-menu__signout"
          data-testid="user-menu-signout"
          (click)="onSignOut()"
        >
          <mat-icon>logout</mat-icon>
          <span>Sign out</span>
        </button>
      </mat-menu>
    } @else {
      <a
        class="user-menu__signin"
        routerLink="/auth"
        matRipple
        aria-label="Sign in"
      >
        <mat-icon aria-hidden="true">login</mat-icon>
        <span>Sign in</span>
      </a>
    }
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .user-menu__trigger {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px 6px 6px;
        background: var(--px-surface);
        border: 1px solid var(--px-line);
        border-radius: 999px;
        cursor: pointer;
        transition: border-color 160ms ease, box-shadow 160ms ease,
          background 160ms ease;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .user-menu__trigger:hover {
        border-color: rgba(124, 58, 237, 0.4);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
      }
      .user-menu__trigger:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }

      .user-menu__avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--px-violet) 0%, #a855f7 60%, var(--px-cyan) 100%);
        color: #ffffff;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
        flex-shrink: 0;
      }
      .user-menu__avatar--big {
        width: 40px;
        height: 40px;
        font-size: 0.95rem;
      }

      .user-menu__identity {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
        text-align: left;
        min-width: 0;
      }
      .user-menu__name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--px-ink);
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .user-menu__email {
        font-size: 0.72rem;
        color: var(--px-muted);
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-menu__chev {
        color: var(--px-muted);
        font-size: 18px;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      @media (max-width: 560px) {
        .user-menu__identity { display: none; }
        .user-menu__chev { display: none; }
        .user-menu__trigger { padding: 4px; }
      }

      .user-menu__signin {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--px-surface);
        color: var(--px-ink);
        border: 1px solid var(--px-line);
        border-radius: 999px;
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 500;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
      }
      .user-menu__signin mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* MatMenu panel tweaks via global overlay reach (scoped via class name) */
      :host ::ng-deep .user-menu__panel.mat-mdc-menu-panel {
        min-width: 240px;
        border-radius: 14px !important;
        padding: 8px;
        box-shadow: 0 18px 40px -12px rgba(15, 23, 42, 0.22),
          0 0 0 1px rgba(15, 23, 42, 0.05);
      }
      :host ::ng-deep .user-menu__panel .mat-mdc-menu-item {
        border-radius: 10px;
        font-size: 0.9rem;
        gap: 12px;
      }
      :host ::ng-deep .user-menu__panel .mat-mdc-menu-item .mat-icon {
        color: var(--px-ink-soft, #334155);
      }
      :host ::ng-deep .user-menu__panel .user-menu__signout {
        color: #b91c1c;
      }
      :host ::ng-deep .user-menu__panel .user-menu__signout .mat-icon {
        color: #b91c1c;
      }

      .user-menu__panel-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px 14px;
      }
      .user-menu__panel-identity {
        display: flex;
        flex-direction: column;
        min-width: 0;
        line-height: 1.2;
      }
      .user-menu__panel-head .user-menu__name {
        max-width: 170px;
      }
      .user-menu__panel-head .user-menu__email {
        max-width: 170px;
      }

      .user-menu__divider {
        border: 0;
        border-top: 1px solid var(--px-line);
        margin: 6px 4px;
      }
    `,
  ],
})
export class UserMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Currently-signed-in user (null = guest/not-signed-in).
   *
   * @remarks
   * Direct pass-through of {@link AuthService.currentUser}. Exposed as a
   * computed so the template reads a single signal per render.
   */
  readonly user = computed<AuthUser | null>(() => this.authService.currentUser());

  /**
   * Two-letter initials derived from the user's name (or email local-part).
   *
   * @returns Uppercased 1–2 character initials (e.g. `"JB"` for Jane Bloggs,
   *   `"D"` for `dev@pixels.dev`). Empty string when no user is signed in.
   *
   * @remarks
   * Name splitting uses whitespace; emails fall back to the first alphanumeric
   * character of the local part. The avatar chip stays legible at 32px.
   */
  readonly initials = computed<string>(() => {
    const u = this.user();
    if (!u) return '';
    const source = (u.name || u.email.split('@')[0] || '').trim();
    if (!source) return '?';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  });

  /**
   * Clear auth state and send the user back to `/auth`.
   *
   * @returns A promise that resolves once navigation to `/auth` settles.
   *
   * @remarks
   * Delegates to {@link AuthService.logout} (clears both the in-memory
   * signals AND the persisted `pixelforge_token` / `pixelforge_user` keys).
   * Navigation happens regardless so a half-completed logout never leaves
   * the user stranded on an authenticated route.
   *
   * @example
   * ```html
   * <button (click)="onSignOut()">Sign out</button>
   * ```
   */
  async onSignOut(): Promise<boolean> {
    this.authService.logout();
    return this.router.navigate(['/auth']);
  }
}
