import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import {
  BrandKitService,
  sanitizeSvg,
  isSvgDataUrl,
  decodeSvgDataUrl,
  encodeSvgToDataUrl,
} from './brand-kit.service';
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

    it('stamps raster logos with the correct mimeType', () => {
      const logo = service.addBrandLogo('R', 'data:image/png;base64,AAA');
      expect(logo.mimeType).toBe('image/png');
    });
  });

  // ----------------------------------------------------------------------
  // PX-003 — SVG sanitization
  // ----------------------------------------------------------------------
  describe('SVG sanitization (PX-003 AC-7)', () => {
    it('isSvgDataUrl detects SVG data URLs', () => {
      expect(isSvgDataUrl('data:image/svg+xml;base64,PHN2Zy8+')).toBe(true);
      expect(isSvgDataUrl('data:image/svg+xml,<svg/>')).toBe(true);
      expect(isSvgDataUrl('data:image/png;base64,AAA')).toBe(false);
      expect(isSvgDataUrl('https://example.com/x.svg')).toBe(false);
    });

    it('decodeSvgDataUrl round-trips with encodeSvgToDataUrl', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
      const url = encodeSvgToDataUrl(svg);
      expect(isSvgDataUrl(url)).toBe(true);
      expect(decodeSvgDataUrl(url)).toBe(svg);
    });

    it('strips <script> tags from SVG', () => {
      const dirty = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const clean = sanitizeSvg(dirty);
      expect(clean).not.toMatch(/<script/i);
    });

    it('strips onload/onerror/onclick event handlers from SVG', () => {
      const dirty =
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">' +
        '<circle r="5" onclick="alert(2)" onerror="alert(3)"/></svg>';
      const clean = sanitizeSvg(dirty);
      expect(clean).not.toMatch(/onload=/i);
      expect(clean).not.toMatch(/onclick=/i);
      expect(clean).not.toMatch(/onerror=/i);
    });

    it('strips <foreignObject> from SVG', () => {
      const dirty =
        '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<foreignObject><iframe src="https://evil.example/"/></foreignObject></svg>';
      const clean = sanitizeSvg(dirty);
      expect(clean).not.toMatch(/<foreignObject/i);
      expect(clean).not.toMatch(/<iframe/i);
    });

    it('sanitizes SVG data URL on addBrandLogo', () => {
      const dirtySvg =
        '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">' +
        '<script>alert(2)</script></svg>';
      const dirtyUrl = 'data:image/svg+xml;base64,' + btoa(dirtySvg);
      const logo = service.addBrandLogo('evil.svg', dirtyUrl);
      expect(logo.mimeType).toBe('image/svg+xml');
      const stored = decodeSvgDataUrl(logo.dataUrl);
      expect(stored).not.toMatch(/<script/i);
      expect(stored).not.toMatch(/onload=/i);
    });
  });

  // ----------------------------------------------------------------------
  // PX-003 — Download SVG button
  // ----------------------------------------------------------------------
  describe('downloadBrandLogoSvg (PX-003 AC-3)', () => {
    it('triggers an <a download> click for SVG logos', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
      const url = encodeSvgToDataUrl(svg);
      const logo = service.addBrandLogo('brand', url);

      // Spy on anchor click + document body append
      const clicks: string[] = [];
      const origCreate = document.createElement.bind(document);
      const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === 'a') {
          (el as HTMLAnchorElement).click = () => {
            clicks.push((el as HTMLAnchorElement).download);
          };
        }
        return el;
      });
      const createURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      const revokeURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      service.downloadBrandLogoSvg(logo);

      expect(clicks).toEqual(['brand.svg']);
      expect(createURL).toHaveBeenCalled();

      createSpy.mockRestore();
      createURL.mockRestore();
      revokeURL.mockRestore();
    });

    it('preserves a trailing .svg in the downloaded filename', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
      const url = encodeSvgToDataUrl(svg);
      const logo = service.addBrandLogo('already.svg', url);

      const clicks: string[] = [];
      const origCreate = document.createElement.bind(document);
      const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag);
        if (tag === 'a') {
          (el as HTMLAnchorElement).click = () => {
            clicks.push((el as HTMLAnchorElement).download);
          };
        }
        return el;
      });
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      service.downloadBrandLogoSvg(logo);
      expect(clicks).toEqual(['already.svg']);
      createSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it('is a no-op for non-SVG logos', () => {
      const logo = service.addBrandLogo('ras.png', 'data:image/png;base64,AAA');
      const createSpy = vi.spyOn(document, 'createElement');
      service.downloadBrandLogoSvg(logo);
      // No anchor creation attempted
      expect(createSpy).not.toHaveBeenCalledWith('a');
      createSpy.mockRestore();
    });
  });
});
