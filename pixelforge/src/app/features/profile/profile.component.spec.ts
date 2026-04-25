import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ProfileComponent } from './profile.component';
import { AuthService, AuthUser } from '../../core/services/auth.service';

/**
 * Vitest suite for {@link ProfileComponent} (PX-065).
 *
 * Covers the signed-in / guest rendering branches, initials derivation,
 * memberSince formatting, and the sign-out flow (AuthService.logout +
 * router.navigate(['/auth']) in that order).
 */
describe('ProfileComponent — PX-065', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let currentUserSig: ReturnType<typeof signal<AuthUser | null>>;
  let logoutSpy: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let updateMeSpy: ReturnType<typeof vi.fn>;

  const mkUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
    id: 'u-42',
    email: 'dev@pixels.dev',
    name: 'Jane Bloggs',
    created_at: '2026-04-24T00:00:00Z',
    ...overrides,
  });

  const setup = async (user: AuthUser | null = mkUser()) => {
    currentUserSig = signal<AuthUser | null>(user);
    logoutSpy = vi.fn();
    updateMeSpy = vi.fn(patch => of(mkUser({ name: patch.name ?? undefined })));

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUserSig,
            logout: logoutSpy,
            updateMe: updateMeSpy,
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true) as ReturnType<
      typeof vi.fn
    >;

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('signed-in branch', () => {
    beforeEach(async () => await setup());

    it('renders the signed-in card with the user card-head', () => {
      expect(fixture.nativeElement.querySelector('.profile__card')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.profile__guest')).toBeNull();
    });

    it('shows the email and display name', () => {
      const text = fixture.nativeElement.textContent || '';
      expect(text).toContain('dev@pixels.dev');
      expect(text).toContain('Jane Bloggs');
    });

    it('derives initials from the name', () => {
      expect(component.initials()).toBe('JB');
    });

    it('formats memberSince as a locale long date', () => {
      const out = component.memberSince();
      expect(out).not.toBe('Unknown');
      expect(out).toMatch(/2026/);
    });

    it('renders a prominent Sign out button', () => {
      const btn = fixture.nativeElement.querySelector<HTMLButtonElement>(
        '[data-testid="profile-signout"]',
      );
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('aria-label')).toBe('Sign out');
    });

    it('sign-out clears auth then navigates to /auth (logout before navigate)', async () => {
      await component.onSignOut();
      expect(logoutSpy).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(['/auth']);
      const logoutCall = logoutSpy.mock.invocationCallOrder[0];
      const navCall = navigate.mock.invocationCallOrder[0];
      expect(logoutCall).toBeLessThan(navCall);
    });
  });

  describe('guest fallback', () => {
    beforeEach(async () => await setup(null));

    it('renders the guest callout with a sign-in action', () => {
      expect(fixture.nativeElement.querySelector('.profile__card')).toBeNull();
      const guest = fixture.nativeElement.querySelector('.profile__guest');
      expect(guest).toBeTruthy();
      const signIn = fixture.nativeElement.querySelector<HTMLAnchorElement>(
        '.profile__signin',
      );
      expect(signIn?.getAttribute('aria-label')).toBe('Sign in');
    });

    it('memberSince falls through to "Unknown" when no user is present', () => {
      expect(component.memberSince()).toBe('Unknown');
    });
  });

  describe('initials derivation edge cases', () => {
    it('falls back to email local-part when name is missing', async () => {
      await setup(mkUser({ name: undefined, email: 'xavier@pixels.dev' }));
      expect(component.initials()).toBe('XA');
    });

    it('memberSince returns "Unknown" for an unparseable created_at', async () => {
      await setup(mkUser({ created_at: 'not-a-date' }));
      expect(component.memberSince()).toBe('Unknown');
    });
  });

  describe('inline name-edit (PX-071)', () => {
    beforeEach(async () => await setup());

    it('starts in display mode with a pencil Edit button', () => {
      expect(component.editingName()).toBe(false);
      const btn = fixture.nativeElement.querySelector<HTMLButtonElement>(
        '[data-testid="profile-name-edit"]',
      );
      expect(btn).toBeTruthy();
      expect(btn?.getAttribute('aria-label')).toBe('Edit display name');
    });

    it('clicking Edit enters edit mode and seeds the draft from current name', () => {
      component.startEditName();
      fixture.detectChanges();
      expect(component.editingName()).toBe(true);
      expect(component.nameDraft()).toBe('Jane Bloggs');
      const input = fixture.nativeElement.querySelector<HTMLInputElement>(
        '[data-testid="profile-name-input"]',
      );
      expect(input).toBeTruthy();
    });

    it('Save button is disabled when the draft equals the saved value', () => {
      component.startEditName();
      fixture.detectChanges();
      const saveBtn = (): HTMLButtonElement | null =>
        fixture.nativeElement.querySelector('[data-testid="profile-name-save"]');
      expect(saveBtn()?.disabled).toBe(true);

      component.nameDraft.set('Jane Blogger');
      fixture.detectChanges();
      expect(saveBtn()?.disabled).toBe(false);
    });

    it('Save calls AuthService.updateMe with the trimmed draft', () => {
      component.startEditName();
      component.nameDraft.set('  New Name  ');
      component.saveEditName();
      expect(updateMeSpy).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('Save exits edit mode on success', () => {
      component.startEditName();
      component.nameDraft.set('New Name');
      component.saveEditName();
      expect(component.editingName()).toBe(false);
      expect(component.savingName()).toBe(false);
      expect(component.nameError()).toBe('');
    });

    it('empty draft sends name:null to clear the field', () => {
      component.startEditName();
      component.nameDraft.set('   ');
      component.saveEditName();
      expect(updateMeSpy).toHaveBeenCalledWith({ name: null });
    });

    it('Cancel exits edit mode without calling the service', () => {
      component.startEditName();
      component.nameDraft.set('Discarded');
      component.cancelEditName();
      expect(component.editingName()).toBe(false);
      expect(updateMeSpy).not.toHaveBeenCalled();
    });

    it('surfaces backend 400 detail as inline error + stays in edit mode', async () => {
      updateMeSpy.mockReturnValueOnce(
        throwError(() => ({
          status: 400,
          error: { detail: 'Display name must be 60 characters or fewer' },
        })),
      );
      component.startEditName();
      component.nameDraft.set('X'.repeat(61));
      component.saveEditName();
      expect(component.editingName()).toBe(true);
      expect(component.nameError()).toBe(
        'Display name must be 60 characters or fewer',
      );
      expect(component.savingName()).toBe(false);
    });

    it('falls back to a generic error when the backend gives no detail', () => {
      updateMeSpy.mockReturnValueOnce(throwError(() => ({ status: 0 })));
      component.startEditName();
      component.nameDraft.set('Network Fail');
      component.saveEditName();
      expect(component.nameError()).toBe('Could not save — please try again.');
    });

    it('nameDirty is false when the draft equals the persisted value (with whitespace trim)', () => {
      component.startEditName();
      component.nameDraft.set('  Jane Bloggs  ');
      expect(component.nameDirty()).toBe(false);
      component.nameDraft.set('Jane');
      expect(component.nameDirty()).toBe(true);
    });
  });
});
