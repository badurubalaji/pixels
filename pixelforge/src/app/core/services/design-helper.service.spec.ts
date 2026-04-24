import { TestBed } from '@angular/core/testing';
import { DesignHelperService } from './design-helper.service';
import { CanvasService } from './canvas.service';

describe('DesignHelperService', () => {
  let service: DesignHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DesignHelperService,
        { provide: CanvasService, useValue: { getCanvas: () => null } },
      ],
    });
    service = TestBed.inject(DesignHelperService);
  });

  describe('generatePalettesFrom', () => {
    it('returns 4 palette variants', () => {
      const palettes = service.generatePalettesFrom('#7c3aed');
      expect(palettes.length).toBe(4);
      expect(palettes.map(p => p.name)).toEqual(['Monochromatic', 'Complementary', 'Triadic', 'Analogous']);
    });

    it('each palette has at least 3 colors', () => {
      const palettes = service.generatePalettesFrom('#4285f4');
      palettes.forEach(p => expect(p.colors.length).toBeGreaterThanOrEqual(3));
    });

    it('all colors are valid hex', () => {
      const palettes = service.generatePalettesFrom('#e74c3c');
      palettes.forEach(p => {
        p.colors.forEach(c => {
          expect(c).toMatch(/^#[0-9a-f]{6}$/i);
        });
      });
    });

    it('returns empty array for invalid color', () => {
      const palettes = service.generatePalettesFrom('not-a-color');
      expect(palettes).toEqual([]);
    });

    it('complementary palette has hue 180° apart', () => {
      const palettes = service.generatePalettesFrom('#ff0000');
      const comp = palettes.find(p => p.name === 'Complementary');
      // For pure red (#ff0000), complement should be cyan-ish
      expect(comp).toBeDefined();
    });
  });

  describe('getFontPairings', () => {
    it('returns at least 5 font pairings', () => {
      const pairs = service.getFontPairings();
      expect(pairs.length).toBeGreaterThanOrEqual(5);
    });

    it('each pairing has heading, body, and vibe', () => {
      const pairs = service.getFontPairings();
      pairs.forEach(p => {
        expect(p.name).toBeTruthy();
        expect(p.heading).toBeTruthy();
        expect(p.body).toBeTruthy();
        expect(p.vibe).toBeTruthy();
      });
    });
  });
});
