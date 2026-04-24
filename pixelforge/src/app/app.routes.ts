import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

/**
 * Top-level application routes.
 *
 * @remarks
 * PX-011 makes `/hub` the default post-auth landing:
 * - `''` (root) redirects to `/hub` (AC-3). Unauthenticated users hitting
 *   `/hub` are then bounced to `/auth` by {@link authGuard} (AC-5).
 * - `/dashboard` remains a reachable, explicit nav target — it's no longer the
 *   default but continues to render the original Dashboard component (AC-4).
 *
 * @see PX-011
 */
export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth').then(m => m.AuthComponent),
  },
  {
    path: 'hub',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/hub/hub.component').then(m => m.HubComponent),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'hub',
  },
  {
    path: 'editor/:id',
    loadChildren: () =>
      import('./features/editor/editor.routes').then(m => m.EDITOR_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'hub',
  },
];
