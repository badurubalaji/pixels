import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BrandKitService } from './brand-kit.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('BrandKitService', () => {
  let service: BrandKitService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        BrandKitService,
        {
          provide: ApiService,
          useValue: {
            getBrandKit: () => of({ colors: [], fonts: [], logos: [] }),
            saveBrandKit: () => of({}),
          },
        },
        {
          provide: AuthService,
          useValue: { currentUser: signal(null) },
        },
      ],
    });
    service = TestBed.inject(BrandKitService);
  });

  describe('Brand colors', () => {
    it('adds a brand color', () => {
      service.addBrandColor('#ff0000');
      expect(service.brandColors()).toContain('#ff0000');
    });

    it('does not duplicate colors', () => {
      service.addBrandColor('#ff0000');
      service.addBrandColor('#ff0000');
      expect(service.brandColors().filter(c => c === '#ff0000').length).toBe(1);
    });

    it('removes a brand color', () => {
      service.addBrandColor('#00ff00');
      service.removeBrandColor('#00ff00');
      expect(service.brandColors()).not.toContain('#00ff00');
    });

    it('ignores empty color', () => {
      const before = service.brandColors().length;
      service.addBrandColor('');
      expect(service.brandColors().length).toBe(before);
    });
  });

  describe('Recent colors', () => {
    it('tracks recent color usage', () => {
      service.trackRecentColor('#123456');
      expect(service.recentColors()[0]).toBe('#123456');
    });

    it('moves reused color to front', () => {
      service.trackRecentColor('#aaa111');
      service.trackRecentColor('#bbb222');
      service.trackRecentColor('#aaa111');
      expect(service.recentColors()[0]).toBe('#aaa111');
    });

    it('caps recent colors at 16', () => {
      for (let i = 0; i < 25; i++) {
        service.trackRecentColor(`#${i.toString(16).padStart(6, '0')}`);
      }
      expect(service.recentColors().length).toBe(16);
    });
  });

  describe('Brand logos', () => {
    it('adds a brand logo with unique id', () => {
      const a = service.addBrandLogo('A', 'data:image/png;base64,AAA');
      const b = service.addBrandLogo('B', 'data:image/png;base64,BBB');
      expect(a.id).not.toBe(b.id);
      expect(service.brandLogos().length).toBe(2);
    });

    it('removes a brand logo by id', () => {
      const logo = service.addBrandLogo('Test', 'data:image/png;base64,ZZZ');
      service.removeBrandLogo(logo.id);
      expect(service.brandLogos().find(l => l.id === logo.id)).toBeUndefined();
    });
  });
});
