import { describe, it, expect } from 'vitest';
import { Route } from '@angular/router';

import { routes } from './app.routes';
import { authGuard } from './core/guards/auth.guard';

/**
 * PX-011 AC-3 / AC-4 / AC-5 static coverage: assert the shape of the top-level
 * route table without spinning up a router — cheaper than an integration test
 * and catches the regressions the story cares about (redirect target, guard
 * wiring, explicit `/dashboard` path still present).
 */
describe('app.routes — PX-011', () => {
  const findRoute = (path: string): Route | undefined =>
    routes.find((r) => r.path === path);

  it('AC-3: root "" redirects to hub with pathMatch "full"', () => {
    const rootRoute = findRoute('');
    expect(rootRoute).toBeDefined();
    expect(rootRoute!.redirectTo).toBe('hub');
    expect(rootRoute!.pathMatch).toBe('full');
  });

  it('AC-4: /dashboard is still an explicit reachable path', () => {
    const dashRoute = findRoute('dashboard');
    expect(dashRoute).toBeDefined();
    // Dashboard continues to load from the same DASHBOARD_ROUTES loader.
    expect(typeof dashRoute!.loadChildren).toBe('function');
    // No forced redirect on explicit nav — only root does that.
    expect(dashRoute!.redirectTo).toBeUndefined();
  });

  it('AC-5: /hub is guarded by authGuard', () => {
    const hubRoute = findRoute('hub');
    expect(hubRoute).toBeDefined();
    expect(hubRoute!.canActivate).toBeDefined();
    expect(hubRoute!.canActivate).toContain(authGuard);
  });

  it('/hub loads HubComponent lazily', () => {
    const hubRoute = findRoute('hub');
    expect(typeof hubRoute!.loadComponent).toBe('function');
  });

  it('/auth is NOT guarded (otherwise unauth redirect would loop)', () => {
    const authRoute = findRoute('auth');
    expect(authRoute).toBeDefined();
    expect(authRoute!.canActivate).toBeUndefined();
  });

  it('wildcard route redirects to hub', () => {
    const wildcard = findRoute('**');
    expect(wildcard).toBeDefined();
    expect(wildcard!.redirectTo).toBe('hub');
  });
});
