import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HubComponent } from './hub.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import { AuthService } from '../../core/services/auth.service';

/**
 * PX-010 AC-8 coverage: render, tile-click navigation, recent-projects
 * empty state, recent-projects populated state.
 */
describe('HubComponent', () => {
  let fixture: ComponentFixture<HubComponent>;
  let component: HubComponent;
  let navigateByUrl: ReturnType<typeof vi.fn>;
  let projectsSignalValue: Project[];

  /**
   * Build a stub ProjectService whose `.projects()` returns `projectsSignalValue`.
   * Tests mutate the outer variable to switch between empty and populated.
   */
  const projectServiceStub: Partial<ProjectService> = {
    projects: (() => projectsSignalValue) as unknown as ProjectService['projects'],
  };

  const setupTestBed = async (initialProjects: Project[] = []): Promise<void> => {
    projectsSignalValue = initialProjects;

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [HubComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: projectServiceStub },
        // PX-065: Hub renders <app-user-menu> which reads AuthService.
        // Provide a benign guest stub so the hub tests stay scoped to hub
        // behavior — user-menu has its own spec.
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            logout: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateByUrl = vi
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true) as ReturnType<typeof vi.fn>;

    fixture = TestBed.createComponent(HubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('rendering', () => {
    beforeEach(async () => {
      await setupTestBed([]);
    });

    it('renders one tile per platform preset (excluding custom + logo) plus the Logo mode-chooser tile', () => {
      // PX-120: catalog expanded from 6 → 19; tile count = 17 platform
      // tiles + 1 hardcoded Logo tile = 18.
      const tileButtons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>(
        'button.hub__tile',
      );
      expect(tileButtons.length).toBe(18);
    });

    it('first three tiles are Instagram presets in the expected order', () => {
      const tileButtons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>(
        'button.hub__tile',
      );

      expect(tileButtons[0].getAttribute('data-tile-id')).toBe('ig-post');
      expect(tileButtons[0].textContent).toContain('Instagram Post');
      expect(tileButtons[0].textContent).toContain('1080×1080');

      expect(tileButtons[1].getAttribute('data-tile-id')).toBe('ig-story');
      expect(tileButtons[1].textContent).toContain('1080×1920');

      expect(tileButtons[2].getAttribute('data-tile-id')).toBe('ig-reel');
      expect(tileButtons[2].textContent).toContain('1080×1920');
    });

    it('renders Facebook + Twitter + LinkedIn + YouTube + TikTok + Pinterest preset tiles', () => {
      const ids = Array.from(
        fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button.hub__tile'),
      ).map((b) => b.getAttribute('data-tile-id'));

      expect(ids).toContain('fb-post');
      expect(ids).toContain('fb-cover');
      expect(ids).toContain('tw-post');
      expect(ids).toContain('tw-header');
      expect(ids).toContain('linkedin-post');
      expect(ids).toContain('linkedin-banner');
      expect(ids).toContain('yt-thumb');
      expect(ids).toContain('yt-channel-art');
      expect(ids).toContain('tiktok-video');
      expect(ids).toContain('pinterest-pin');
    });

    it('renders a Logo tile with "Make a logo" subtitle', () => {
      const logoTile = fixture.nativeElement.querySelector<HTMLButtonElement>(
        'button.hub__tile[data-tile-id="logo"]',
      );
      expect(logoTile).toBeTruthy();
      expect(logoTile!.textContent).toContain('Logo');
      expect(logoTile!.textContent).toContain('Make a logo');
    });

    it('does NOT render a tile for the custom preset', () => {
      const customTile = fixture.nativeElement.querySelector(
        'button.hub__tile[data-tile-id="custom"]',
      );
      expect(customTile).toBeFalsy();
    });

    it('gives every tile an aria-label and is a <button type="button">', () => {
      const tileButtons = fixture.nativeElement.querySelectorAll<HTMLButtonElement>(
        'button.hub__tile',
      );
      tileButtons.forEach((btn) => {
        expect(btn.getAttribute('type')).toBe('button');
        expect(btn.getAttribute('aria-label')?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('tile-click navigation (AC-3)', () => {
    beforeEach(async () => {
      await setupTestBed([]);
    });

    const cases: Array<{ id: string; route: string }> = [
      { id: 'ig-post', route: '/gallery/ig-post' },
      { id: 'ig-story', route: '/gallery/ig-story' },
      { id: 'linkedin-post', route: '/gallery/linkedin-post' },
      { id: 'linkedin-banner', route: '/gallery/linkedin-banner' },
      { id: 'yt-thumb', route: '/gallery/yt-thumb' },
      { id: 'logo', route: '/logo/mode-chooser' },
    ];

    for (const c of cases) {
      it(`tile "${c.id}" navigates to ${c.route}`, () => {
        const btn = fixture.nativeElement.querySelector<HTMLButtonElement>(
          `button.hub__tile[data-tile-id="${c.id}"]`,
        );
        expect(btn).toBeTruthy();
        btn!.click();
        expect(navigateByUrl).toHaveBeenCalledWith(c.route);
      });
    }
  });

  describe('recent projects — empty state (AC-4)', () => {
    beforeEach(async () => {
      await setupTestBed([]);
    });

    it('shows the empty-state message', () => {
      const empty = fixture.nativeElement.querySelector('.hub__recent-empty');
      expect(empty).toBeTruthy();
      expect(empty!.textContent).toContain('No recent projects');
    });

    it('does not render the recent-projects strip', () => {
      const strip = fixture.nativeElement.querySelector('.hub__recent-strip');
      expect(strip).toBeFalsy();
    });

    it('exposes hasProjects() as false', () => {
      expect(component.hasProjects()).toBe(false);
    });
  });

  describe('recent projects — populated (AC-4)', () => {
    const mkProject = (id: string, name: string): Project => ({
      id,
      name,
      width: 1080,
      height: 1080,
      createdAt: new Date(),
      updatedAt: new Date(),
      layers: [],
    });

    beforeEach(async () => {
      await setupTestBed([
        mkProject('p1', 'Alpha'),
        mkProject('p2', 'Beta'),
        mkProject('p3', 'Gamma'),
      ]);
    });

    it('renders one tile per project in the strip', () => {
      const tiles = fixture.nativeElement.querySelectorAll('.hub__recent-tile');
      expect(tiles.length).toBe(3);
    });

    it('renders project names', () => {
      const names = Array.from(
        fixture.nativeElement.querySelectorAll<HTMLElement>('.hub__recent-name'),
      ).map((el) => el.textContent?.trim());
      expect(names).toEqual(['Alpha', 'Beta', 'Gamma']);
    });

    it('caps the list at 8 even if the service returns more', async () => {
      const many = Array.from({ length: 12 }, (_, i) => mkProject(`p${i}`, `Project ${i}`));
      await setupTestBed(many);
      const tiles = fixture.nativeElement.querySelectorAll('.hub__recent-tile');
      expect(tiles.length).toBe(8);
    });

    it('clicking a recent-project tile navigates to /editor/:id', () => {
      const btn = fixture.nativeElement.querySelector<HTMLButtonElement>('.hub__recent-tile');
      expect(btn).toBeTruthy();
      btn!.click();
      expect(navigateByUrl).toHaveBeenCalledWith('/editor/p1');
    });
  });

  describe('degraded loading', () => {
    it('falls back to empty state if ProjectService throws', async () => {
      const throwingStub = {
        projects: () => {
          throw new Error('localStorage blocked');
        },
      };
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [HubComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          { provide: ProjectService, useValue: throwingStub },
          {
            provide: AuthService,
            useValue: { currentUser: signal(null), logout: vi.fn() },
          },
        ],
      }).compileComponents();

      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      const f = TestBed.createComponent(HubComponent);
      f.detectChanges();
      expect(f.componentInstance.projects()).toEqual([]);
      expect(f.componentInstance.hasProjects()).toBe(false);
    });
  });

  describe('start-from-scratch stub', () => {
    beforeEach(async () => {
      await setupTestBed([]);
    });

    it('renders the Start-from-scratch button', () => {
      const btn = fixture.nativeElement.querySelector<HTMLButtonElement>('.hub__scratch');
      expect(btn).toBeTruthy();
      expect(btn!.getAttribute('aria-label')).toBe('Start from scratch');
    });

    it('clicking it does not throw (stub per PX-010 scope)', () => {
      const btn = fixture.nativeElement.querySelector<HTMLButtonElement>('.hub__scratch');
      expect(() => btn!.click()).not.toThrow();
    });
  });
});
