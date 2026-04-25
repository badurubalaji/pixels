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
  let changePasswordSpy: ReturnType<typeof vi.fn>;
  let uploadAvatarSpy: ReturnType<typeof vi.fn>;
  let deleteAvatarSpy: ReturnType<typeof vi.fn>;
  let avatarSrcImpl: (
    user: { avatar_url?: string | null } | null | undefined,
  ) => string | null;

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
    changePasswordSpy = vi.fn(() => of(undefined));
    uploadAvatarSpy = vi.fn(() =>
      of(mkUser({ avatar_url: '/api/auth/avatar/u-42?v=1' })),
    );
    deleteAvatarSpy = vi.fn(() => of(mkUser({ avatar_url: null })));
    avatarSrcImpl = (u): string | null =>
      u?.avatar_url ? `http://localhost:8000${u.avatar_url}` : null;

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
            changePassword: changePasswordSpy,
            uploadAvatar: uploadAvatarSpy,
            deleteAvatar: deleteAvatarSpy,
            avatarSrc: vi.fn(u => avatarSrcImpl(u)),
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

  describe('change password (PX-075)', () => {
    beforeEach(async () => await setup());

    it('starts collapsed with a "Change password" trigger button', () => {
      expect(component.changingPwd()).toBe(false);
      const trigger = fixture.nativeElement.querySelector<HTMLButtonElement>(
        '[data-testid="profile-pwd-trigger"]',
      );
      expect(trigger).toBeTruthy();
    });

    it('startChangePwd opens the section and clears any prior state', () => {
      component.pwdError.set('stale');
      component.pwdSuccess.set(true);
      component.startChangePwd();
      fixture.detectChanges();
      expect(component.changingPwd()).toBe(true);
      expect(component.pwdError()).toBe('');
      expect(component.pwdSuccess()).toBe(false);
      const cur = fixture.nativeElement.querySelector(
        '[data-testid="profile-pwd-current"]',
      );
      expect(cur).toBeTruthy();
    });

    it('pwdReady is false until both fields have content and next ≥ 6 chars', () => {
      component.startChangePwd();
      expect(component.pwdReady()).toBe(false);
      component.pwdCurrent.set('old-pw');
      component.pwdNext.set('abc');
      expect(component.pwdReady()).toBe(false);
      component.pwdNext.set('abcdef');
      expect(component.pwdReady()).toBe(true);
    });

    it('Save calls AuthService.changePassword with the typed values', () => {
      component.startChangePwd();
      component.pwdCurrent.set('old-password');
      component.pwdNext.set('new-password');
      component.saveChangePwd();
      expect(changePasswordSpy).toHaveBeenCalledWith('old-password', 'new-password');
    });

    it('on success: clears inputs, shows success pill, stays in section', () => {
      component.startChangePwd();
      component.pwdCurrent.set('old-password');
      component.pwdNext.set('new-password');
      component.saveChangePwd();
      expect(component.pwdSuccess()).toBe(true);
      expect(component.pwdCurrent()).toBe('');
      expect(component.pwdNext()).toBe('');
      expect(component.changingPwd()).toBe(true);
      expect(component.pwdSaving()).toBe(false);
      expect(component.pwdError()).toBe('');
    });

    it('Cancel collapses the section without calling the service', () => {
      component.startChangePwd();
      component.pwdCurrent.set('discarded');
      component.pwdNext.set('alsoDiscarded');
      component.cancelChangePwd();
      expect(component.changingPwd()).toBe(false);
      expect(component.pwdCurrent()).toBe('');
      expect(component.pwdNext()).toBe('');
      expect(changePasswordSpy).not.toHaveBeenCalled();
    });

    it('surfaces 401 detail (wrong current) inline + stays in edit mode', () => {
      changePasswordSpy.mockReturnValueOnce(
        throwError(() => ({
          status: 401,
          error: { detail: 'Current password is incorrect' },
        })),
      );
      component.startChangePwd();
      component.pwdCurrent.set('wrong');
      component.pwdNext.set('newPassword');
      component.saveChangePwd();
      expect(component.changingPwd()).toBe(true);
      expect(component.pwdError()).toBe('Current password is incorrect');
      expect(component.pwdSaving()).toBe(false);
    });

    it('falls back to a generic error when the backend gives no detail', () => {
      changePasswordSpy.mockReturnValueOnce(throwError(() => ({ status: 0 })));
      component.startChangePwd();
      component.pwdCurrent.set('whatever');
      component.pwdNext.set('newPassword');
      component.saveChangePwd();
      expect(component.pwdError()).toBe(
        'Could not update password — please try again.',
      );
    });

    it('Save is a no-op while pwdReady is false', () => {
      component.startChangePwd();
      component.pwdCurrent.set('only-current');
      component.saveChangePwd();
      expect(changePasswordSpy).not.toHaveBeenCalled();
    });
  });

  describe('avatar upload (PX-073)', () => {
    /** Build a `File` that satisfies the size/MIME guards. */
    const makeFile = (
      name = 'me.png',
      type = 'image/png',
      sizeBytes = 1024,
    ): File => {
      const blob = new Blob([new Uint8Array(sizeBytes)], { type });
      return new File([blob], name, { type });
    };

    beforeEach(async () => await setup());

    it('renders the gradient initials avatar when user has no avatar_url', () => {
      const img = fixture.nativeElement.querySelector(
        'img.profile__avatar--image',
      );
      const initialsEl = fixture.nativeElement.querySelector('.profile__avatar');
      expect(img).toBeNull();
      expect(initialsEl?.textContent?.trim()).toBe('JB');
    });

    it('renders an <img> avatar when user.avatar_url is set', async () => {
      await setup(mkUser({ avatar_url: '/api/auth/avatar/u-42?v=1' }));
      const img = fixture.nativeElement.querySelector<HTMLImageElement>(
        'img.profile__avatar--image',
      );
      expect(img).toBeTruthy();
      expect(img?.src).toContain('/api/auth/avatar/u-42');
    });

    it('rejects an unsupported MIME client-side without calling the service', () => {
      component.onAvatarFileChange({
        target: { files: [makeFile('note.txt', 'text/plain')], value: 'note.txt' },
      } as unknown as Event);
      expect(component.avatarError()).toBe(
        'Avatar must be a PNG, JPEG, or WebP image.',
      );
      expect(uploadAvatarSpy).not.toHaveBeenCalled();
    });

    it('rejects an oversize file client-side without calling the service', () => {
      component.onAvatarFileChange({
        target: {
          files: [makeFile('big.png', 'image/png', 1_100_000)],
          value: 'big.png',
        },
      } as unknown as Event);
      expect(component.avatarError()).toBe('Avatar must be 1 MB or smaller.');
      expect(uploadAvatarSpy).not.toHaveBeenCalled();
    });

    it('valid file dispatches uploadAvatar and clears uploading state on success', () => {
      const file = makeFile();
      component.onAvatarFileChange({
        target: { files: [file], value: 'me.png' },
      } as unknown as Event);
      expect(uploadAvatarSpy).toHaveBeenCalledWith(file);
      expect(component.uploadingAvatar()).toBe(false);
      expect(component.avatarError()).toBe('');
    });

    it('surfaces backend error detail on upload failure', () => {
      uploadAvatarSpy.mockReturnValueOnce(
        throwError(() => ({
          status: 422,
          error: { detail: 'Image could not be decoded' },
        })),
      );
      component.onAvatarFileChange({
        target: { files: [makeFile()], value: 'me.png' },
      } as unknown as Event);
      expect(component.avatarError()).toBe('Image could not be decoded');
      expect(component.uploadingAvatar()).toBe(false);
    });

    it('removeAvatar calls deleteAvatar and clears state on success', async () => {
      await setup(mkUser({ avatar_url: '/api/auth/avatar/u-42?v=1' }));
      component.removeAvatar();
      expect(deleteAvatarSpy).toHaveBeenCalled();
      expect(component.uploadingAvatar()).toBe(false);
    });

    it('removeAvatar surfaces error detail on failure', async () => {
      await setup(mkUser({ avatar_url: '/api/auth/avatar/u-42?v=1' }));
      deleteAvatarSpy.mockReturnValueOnce(
        throwError(() => ({ status: 0 })),
      );
      component.removeAvatar();
      expect(component.avatarError()).toBe('Could not remove — please try again.');
    });

    it('Remove button only renders when an avatar is set', async () => {
      // No avatar — no Remove button.
      expect(
        fixture.nativeElement.querySelector('[data-testid="profile-avatar-remove"]'),
      ).toBeNull();

      await setup(mkUser({ avatar_url: '/api/auth/avatar/u-42?v=1' }));
      expect(
        fixture.nativeElement.querySelector('[data-testid="profile-avatar-remove"]'),
      ).toBeTruthy();
    });
  });
});
