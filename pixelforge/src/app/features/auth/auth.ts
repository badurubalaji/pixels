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
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo">
          <mat-icon class="logo-icon">palette</mat-icon>
          <h1>Pixelforge</h1>
        </div>

        <div class="tab-switcher">
          <button
            class="tab-btn"
            [class.active]="mode() === 'login'"
            (click)="mode.set('login'); error.set('')"
          >
            Log In
          </button>
          <button
            class="tab-btn"
            [class.active]="mode() === 'signup'"
            (click)="mode.set('signup'); error.set('')"
          >
            Sign Up
          </button>
        </div>

        <form class="auth-form" (submit)="submit($event)">
          @if (mode() === 'signup') {
            <mat-form-field appearance="outline" class="auth-field">
              <mat-label>Name (optional)</mat-label>
              <input matInput [ngModel]="name()" (ngModelChange)="name.set($event)" name="name" />
            </mat-form-field>
          }

          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Email</mat-label>
            <input matInput type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required />
          </mat-form-field>

          <mat-form-field appearance="outline" class="auth-field">
            <mat-label>Password</mat-label>
            <input matInput type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required minlength="6" />
            @if (mode() === 'signup') {
              <mat-hint>At least 6 characters</mat-hint>
            }
          </mat-form-field>

          @if (error(); as err) {
            <div class="error-msg">
              <mat-icon>error_outline</mat-icon>
              {{ err }}
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
              {{ mode() === 'login' ? 'Log In' : 'Sign Up' }}
            }
          </button>
        </form>

        <button mat-button class="skip-btn" (click)="continueAsGuest()">
          Continue as guest
        </button>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px 32px;
      background: var(--mat-sys-surface-container);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .logo {
      text-align: center;
      margin-bottom: 32px;

      .logo-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        color: var(--mat-sys-primary);
      }

      h1 {
        margin: 8px 0 0;
        font-size: 1.8rem;
        font-weight: 700;
      }
    }

    .tab-switcher {
      display: flex;
      gap: 4px;
      margin-bottom: 24px;
      padding: 4px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 10px;
    }

    .tab-btn {
      flex: 1;
      padding: 10px;
      background: none;
      border: none;
      border-radius: 8px;
      color: inherit;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s;

      &.active {
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
      }

      &:not(.active):hover {
        background: var(--mat-sys-surface-container-highest);
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .auth-field {
      width: 100%;
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      background: rgba(239, 68, 68, 0.12);
      color: #fca5a5;
      border-radius: 8px;
      font-size: 0.85rem;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }
    }

    .submit-btn {
      height: 44px;
      font-size: 0.95rem;
      margin-top: 8px;

      mat-spinner ::ng-deep circle {
        stroke: var(--mat-sys-on-primary);
      }
    }

    .skip-btn {
      width: 100%;
      margin-top: 16px;
      opacity: 0.6;
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
      this.error.set(err.error?.detail || 'Something went wrong');
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
