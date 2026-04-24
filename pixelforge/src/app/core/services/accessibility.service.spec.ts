import { TestBed } from '@angular/core/testing';
import { AccessibilityService } from './accessibility.service';
import { CanvasService } from './canvas.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccessibilityService,
        { provide: CanvasService, useValue: { getCanvas: () => null } },
      ],
    });
    service = TestBed.inject(AccessibilityService);
  });

  describe('contrastRatio', () => {
    it('returns 21 for black on white', () => {
      const result = service.contrastRatio('#000000', '#ffffff');
      expect(result.ratio).toBe(21);
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(true);
    });

    it('returns 1 for same color', () => {
      const result = service.contrastRatio('#666666', '#666666');
      expect(result.ratio).toBe(1);
      expect(result.passAA).toBe(false);
    });

    it('flags low-contrast gray on white as failing AA', () => {
      const result = service.contrastRatio('#aaaaaa', '#ffffff');
      expect(result.passAA).toBe(false);
      expect(result.passAALarge).toBe(false);
    });

    it('accepts 3-digit hex', () => {
      const result = service.contrastRatio('#000', '#fff');
      expect(result.ratio).toBe(21);
    });

    it('accepts rgb() format', () => {
      const result = service.contrastRatio('rgb(0,0,0)', 'rgb(255,255,255)');
      expect(result.ratio).toBe(21);
    });

    it('passes AA but not AAA for medium contrast', () => {
      // #767676 on white gives about 4.54:1 (just above AA threshold)
      const result = service.contrastRatio('#767676', '#ffffff');
      expect(result.passAA).toBe(true);
      expect(result.passAAA).toBe(false);
    });
  });
});
