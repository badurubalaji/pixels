import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { UserMenuComponent } from './user-menu.component';
import { AuthService, AuthUser } from '../../core/services/auth.service';

/**
 * Vitest suite for {@link UserMenuComponent} (PX-065).
 *
 * Covers:
 *   * initials derivation (name > email fallback)
 *   * signed-in vs guest branch (trigger chip vs sign-in pill)
 *   * sign-out flow: AuthService.logout + navigate('/auth')
 */
describe('UserMenuComponent — PX-065', () => {
  let fixture: ComponentFixture<UserMenuComponent>;
  let component: UserMenuComponent;
  let currentUserSig: ReturnType<typeof signal<AuthUser | null>>;
  let logoutSpy: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;

  const mkUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
    id: 'u1',
    email: 'dev@pixels.dev',
    name: 'Jane Bloggs',
    created_at: '2026-04-24T00:00:00Z',
    ...overrides,
  });

  const setup = async (user: AuthUser | null = mkUser()) => {
    currentUserSig = signal<AuthUser | null>(user);
    logoutSpy = vi.fn();

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [UserMenuComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUserSig,
            logout: logoutSpy,
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true) as ReturnType<
      typeof vi.fn
    >;

    fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('initials', () => {
    it('derives two-letter initials from a multi-word name', async () => {
      await setup(mkUser({ name: 'Jane Bloggs' }));
      expect(component.initials()).toBe('JB');
    });

    it('derives one-letter initials when only a single-word name is set', async () => {
      await setup(mkUser({ name: 'Dev' }));
      expect(component.initials()).toBe('DE');
    });

    it('falls back to email local-part when no name is set', async () => {
      await setup(mkUser({ name: undefined, email: 'xavier@pixels.dev' }));
      expect(component.initials()).toBe('XA');
    });

    it('returns empty string for a guest (no signed-in user)', async () => {
      await setup(null);
      expect(component.initials()).toBe('');
    });
  });

  describe('rendering branch', () => {
    it('renders the signed-in trigger chip when a user is present', async () => {
      await setup();
      const trigger = fixture.nativeElement.querySelector(
        'button.user-menu__trigger',
      );
      expect(trigger).toBeTruthy();
      expect(trigger?.getAttribute('aria-label')).toContain('Jane Bloggs');
      expect(fixture.nativeElement.querySelector('.user-menu__signin')).toBeNull();
    });

    it('renders a Sign in pill link when no user is present', async () => {
      await setup(null);
      const signin = fixture.nativeElement.querySelector<HTMLAnchorElement>(
        '.user-menu__signin',
      );
      expect(signin).toBeTruthy();
      expect(signin?.getAttribute('aria-label')).toBe('Sign in');
      expect(fixture.nativeElement.querySelector('.user-menu__trigger')).toBeNull();
    });
  });

  describe('sign-out flow', () => {
    it('calls AuthService.logout then navigates to /auth', async () => {
      await setup();
      await component.onSignOut();
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/auth']);
      // Order: logout must happen BEFORE navigate so the post-nav render
      // sees the cleared user signal and the Sign-In pill.
      const logoutCall = logoutSpy.mock.invocationCallOrder[0];
      const navCall = navigate.mock.invocationCallOrder[0];
      expect(logoutCall).toBeLessThan(navCall);
    });
  });
});
