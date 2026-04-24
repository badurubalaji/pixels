import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { AuthComponent } from './auth';
import { AuthService, AuthResponse } from '../../core/services/auth.service';

/**
 * PX-011 AC-1 / AC-2 / AC-6 coverage: post-login, post-signup, and guest
 * paths all navigate to `/hub`.
 */
describe('AuthComponent — PX-011 navigation', () => {
  let fixture: ComponentFixture<AuthComponent>;
  let component: AuthComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let authServiceStub: Partial<AuthService>;

  const mkAuthResponse = (): AuthResponse => ({
    token: 'tok_123',
    user: {
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      created_at: new Date().toISOString(),
    },
  });

  const setup = async (overrides: Partial<AuthService> = {}): Promise<void> => {
    navigate = vi.fn().mockResolvedValue(true);

    authServiceStub = {
      login: vi.fn().mockReturnValue(of(mkAuthResponse())),
      signup: vi.fn().mockReturnValue(of(mkAuthResponse())),
      ...overrides,
    };

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('AC-1 — post-login navigation', () => {
    beforeEach(async () => {
      await setup();
    });

    it('navigates to /hub on successful login', () => {
      component.mode.set('login');
      component.email.set('alice@example.com');
      component.password.set('pw123456');

      component.submit(new Event('submit'));

      expect(authServiceStub.login).toHaveBeenCalledWith('alice@example.com', 'pw123456');
      expect(navigate).toHaveBeenCalledWith(['/hub']);
      expect(navigate).not.toHaveBeenCalledWith(['/dashboard']);
      expect(navigate).not.toHaveBeenCalledWith(['/']);
    });

    it('does NOT navigate on login failure', async () => {
      await setup({
        login: vi.fn().mockReturnValue(
          throwError(() => ({ error: { detail: 'bad creds' } })),
        ),
      });

      component.mode.set('login');
      component.email.set('alice@example.com');
      component.password.set('pw123456');

      component.submit(new Event('submit'));

      expect(navigate).not.toHaveBeenCalled();
      expect(component.error()).toBe('bad creds');
      expect(component.loading()).toBe(false);
    });

    it('surfaces Pydantic validation-array 422s as readable field:msg text', async () => {
      await setup({
        signup: vi.fn().mockReturnValue(
          throwError(() => ({
            status: 422,
            error: {
              detail: [
                {
                  type: 'value_error',
                  loc: ['body', 'email'],
                  msg: 'value is not a valid email address: reserved TLD',
                },
              ],
            },
          })),
        ),
      });

      component.mode.set('signup');
      component.email.set('bad@foo.local');
      component.password.set('pw123456');

      component.submit(new Event('submit'));

      expect(component.error()).toBe(
        'email: value is not a valid email address: reserved TLD',
      );
    });

    it('falls back to "Something went wrong" when no detail is present', async () => {
      await setup({
        login: vi.fn().mockReturnValue(throwError(() => ({ status: 0 }))),
      });
      component.mode.set('login');
      component.email.set('a@b.com');
      component.password.set('pw123456');
      component.submit(new Event('submit'));
      expect(component.error()).toBe('Something went wrong');
    });
  });

  describe('AC-2 — post-signup navigation', () => {
    beforeEach(async () => {
      await setup();
    });

    it('navigates to /hub on successful signup', () => {
      component.mode.set('signup');
      component.email.set('bob@example.com');
      component.password.set('pw999999');
      component.name.set('Bob');

      component.submit(new Event('submit'));

      expect(authServiceStub.signup).toHaveBeenCalledWith(
        'bob@example.com',
        'pw999999',
        'Bob',
      );
      expect(navigate).toHaveBeenCalledWith(['/hub']);
      expect(navigate).not.toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('AC-6 — guest path', () => {
    beforeEach(async () => {
      await setup();
    });

    it('navigates to /hub when continuing as guest', () => {
      component.continueAsGuest();
      expect(navigate).toHaveBeenCalledWith(['/hub']);
      expect(navigate).not.toHaveBeenCalledWith(['/dashboard']);
      expect(navigate).not.toHaveBeenCalledWith(['/']);
    });
  });

  describe('loading flag management', () => {
    beforeEach(async () => {
      await setup();
    });

    it('clears loading after successful login', () => {
      component.mode.set('login');
      component.email.set('alice@example.com');
      component.password.set('pw123456');
      component.submit(new Event('submit'));
      expect(component.loading()).toBe(false);
    });
  });

  describe('password visibility toggle', () => {
    beforeEach(async () => {
      await setup();
    });

    it('defaults to masked (passwordVisible = false)', () => {
      expect(component.passwordVisible()).toBe(false);
      const input: HTMLInputElement | null = fixture.nativeElement.querySelector(
        'input[name="password"]',
      );
      expect(input?.type).toBe('password');
    });

    it('togglePasswordVisibility flips masked → plain text', () => {
      component.togglePasswordVisibility();
      fixture.detectChanges();
      expect(component.passwordVisible()).toBe(true);
      const input: HTMLInputElement | null = fixture.nativeElement.querySelector(
        'input[name="password"]',
      );
      expect(input?.type).toBe('text');
    });

    it('toggle twice returns to masked', () => {
      component.togglePasswordVisibility();
      component.togglePasswordVisibility();
      expect(component.passwordVisible()).toBe(false);
    });

    it('toggle button aria-label reflects state', () => {
      const btn = (): HTMLButtonElement | null =>
        fixture.nativeElement.querySelector('button.password-toggle');
      expect(btn()?.getAttribute('aria-label')).toBe('Show password');
      component.togglePasswordVisibility();
      fixture.detectChanges();
      expect(btn()?.getAttribute('aria-label')).toBe('Hide password');
    });

    it('toggle button has type="button" (does not submit the form)', () => {
      const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector(
        'button.password-toggle',
      );
      expect(btn?.getAttribute('type')).toBe('button');
    });
  });
});
