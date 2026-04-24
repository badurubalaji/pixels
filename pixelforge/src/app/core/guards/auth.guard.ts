import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Functional auth guard — permits activation only when the user is authenticated.
 *
 * @returns `true` when {@link AuthService.isAuthenticated} is truthy; otherwise
 *   a {@link UrlTree} redirecting to `/auth` (PX-011 AC-5).
 *
 * @remarks
 * Added under PX-011 to protect `/hub` and other authenticated surfaces. Uses
 * {@link Router.parseUrl} to produce a declarative redirect UrlTree rather than
 * an imperative `navigate` call — this plays correctly with Angular's router
 * lifecycle and preserves the original navigation intent on the stack.
 *
 * @example
 * ```ts
 * // in app.routes.ts
 * { path: 'hub', canActivate: [authGuard], loadComponent: ... }
 * ```
 *
 * @see PX-011 AC-5
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.parseUrl('/auth');
};
