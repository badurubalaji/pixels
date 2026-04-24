import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth').then(m => m.AuthComponent),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'editor/:id',
    loadChildren: () =>
      import('./features/editor/editor.routes').then(m => m.EDITOR_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
