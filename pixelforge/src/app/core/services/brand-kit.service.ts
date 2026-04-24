import { Injectable, inject, signal, effect } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface BrandLogo {
  id: string;
  name: string;
  dataUrl: string;
}

const BRAND_COLORS_KEY = 'pixelforge_brand_colors';
const BRAND_FONTS_KEY = 'pixelforge_brand_fonts';
const BRAND_LOGOS_KEY = 'pixelforge_brand_logos';
const RECENT_COLORS_KEY = 'pixelforge_recent_colors';
const RECENT_FONTS_KEY = 'pixelforge_recent_fonts';

const MAX_RECENT_COLORS = 16;
const MAX_RECENT_FONTS = 12;

@Injectable({ providedIn: 'root' })
export class BrandKitService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly _brandColors = signal<string[]>([]);
  private readonly _brandFonts = signal<string[]>([]);
  private readonly _brandLogos = signal<BrandLogo[]>([]);
  private readonly _recentColors = signal<string[]>([]);
  private readonly _recentFonts = signal<string[]>([]);

  readonly brandColors = this._brandColors.asReadonly();
  readonly brandFonts = this._brandFonts.asReadonly();
  readonly brandLogos = this._brandLogos.asReadonly();
  readonly recentColors = this._recentColors.asReadonly();
  readonly recentFonts = this._recentFonts.asReadonly();

  private syncTimer: any = null;
  private suppressSync = false;

  constructor() {
    this.load();
    // Auto-sync to backend when authenticated
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fetchFromBackend();
      }
    });
  }

  private fetchFromBackend(): void {
    this.apiService.getBrandKit().subscribe({
      next: (kit) => {
        this.suppressSync = true;
        // Merge: backend wins for shared items, local additions are pushed up
        const localColors = this._brandColors();
        const localFonts = this._brandFonts();
        const localLogos = this._brandLogos();

        const mergedColors = Array.from(new Set([...kit.colors, ...localColors]));
        const mergedFonts = Array.from(new Set([...kit.fonts, ...localFonts]));
        const existingLogoIds = new Set(kit.logos.map(l => l.id));
        const mergedLogos = [...kit.logos, ...localLogos.filter(l => !existingLogoIds.has(l.id))];

        this._brandColors.set(mergedColors);
        this._brandFonts.set(mergedFonts);
        this._brandLogos.set(mergedLogos);
        this.persistAll();

        this.suppressSync = false;
        this.scheduleSync();
      },
    });
  }

  private scheduleSync(): void {
    if (this.suppressSync || !this.authService.currentUser()) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.apiService.saveBrandKit({
        colors: this._brandColors(),
        fonts: this._brandFonts(),
        logos: this._brandLogos(),
      }).subscribe({ error: () => {} });
    }, 1500);
  }

  private persistAll(): void {
    this.persist(BRAND_COLORS_KEY, this._brandColors());
    this.persist(BRAND_FONTS_KEY, this._brandFonts());
    this.persist(BRAND_LOGOS_KEY, this._brandLogos());
  }

  // --- Brand Colors ---

  addBrandColor(color: string): void {
    if (!color || this._brandColors().includes(color)) return;
    this._brandColors.update(c => [color, ...c]);
    this.persist(BRAND_COLORS_KEY, this._brandColors());
    this.scheduleSync();
  }

  removeBrandColor(color: string): void {
    this._brandColors.update(c => c.filter(x => x !== color));
    this.persist(BRAND_COLORS_KEY, this._brandColors());
    this.scheduleSync();
  }

  // --- Brand Fonts ---

  addBrandFont(font: string): void {
    if (!font || this._brandFonts().includes(font)) return;
    this._brandFonts.update(f => [font, ...f]);
    this.persist(BRAND_FONTS_KEY, this._brandFonts());
    this.scheduleSync();
  }

  removeBrandFont(font: string): void {
    this._brandFonts.update(f => f.filter(x => x !== font));
    this.persist(BRAND_FONTS_KEY, this._brandFonts());
    this.scheduleSync();
  }

  // --- Brand Logos ---

  addBrandLogo(name: string, dataUrl: string): BrandLogo {
    const logo: BrandLogo = { id: crypto.randomUUID(), name, dataUrl };
    this._brandLogos.update(l => [logo, ...l]);
    this.persist(BRAND_LOGOS_KEY, this._brandLogos());
    this.scheduleSync();
    return logo;
  }

  removeBrandLogo(id: string): void {
    this._brandLogos.update(l => l.filter(x => x.id !== id));
    this.persist(BRAND_LOGOS_KEY, this._brandLogos());
    this.scheduleSync();
  }

  // --- Recent Colors ---

  trackRecentColor(color: string): void {
    if (!color) return;
    this._recentColors.update(c => {
      const filtered = c.filter(x => x !== color);
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
    this.persist(RECENT_COLORS_KEY, this._recentColors());
  }

  // --- Recent Fonts ---

  trackRecentFont(font: string): void {
    if (!font) return;
    this._recentFonts.update(f => {
      const filtered = f.filter(x => x !== font);
      return [font, ...filtered].slice(0, MAX_RECENT_FONTS);
    });
    this.persist(RECENT_FONTS_KEY, this._recentFonts());
  }

  // --- Persistence ---

  private load(): void {
    try {
      const colors = localStorage.getItem(BRAND_COLORS_KEY);
      if (colors) this._brandColors.set(JSON.parse(colors));

      const fonts = localStorage.getItem(BRAND_FONTS_KEY);
      if (fonts) this._brandFonts.set(JSON.parse(fonts));

      const logos = localStorage.getItem(BRAND_LOGOS_KEY);
      if (logos) this._brandLogos.set(JSON.parse(logos));

      const recentColors = localStorage.getItem(RECENT_COLORS_KEY);
      if (recentColors) this._recentColors.set(JSON.parse(recentColors));

      const recentFonts = localStorage.getItem(RECENT_FONTS_KEY);
      if (recentFonts) this._recentFonts.set(JSON.parse(recentFonts));
    } catch (e) {
      console.warn('Failed to load brand kit:', e);
    }
  }

  private persist(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to save ${key}:`, e);
    }
  }
}
