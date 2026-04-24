import { Injectable, signal } from '@angular/core';

export interface FontEntry {
  family: string;
  category: 'display' | 'sans-serif' | 'serif' | 'handwriting' | 'monospace';
}

export const GOOGLE_FONTS: FontEntry[] = [
  // Display
  { family: 'Playfair Display', category: 'display' },
  { family: 'Abril Fatface', category: 'display' },
  { family: 'Lobster', category: 'display' },
  { family: 'Righteous', category: 'display' },
  { family: 'Permanent Marker', category: 'display' },
  { family: 'Bungee', category: 'display' },
  // Sans-Serif
  { family: 'Inter', category: 'sans-serif' },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif' },
  { family: 'Raleway', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif' },
  { family: 'Oswald', category: 'sans-serif' },
  { family: 'Rubik', category: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif' },
  { family: 'DM Sans', category: 'sans-serif' },
  { family: 'Space Grotesk', category: 'sans-serif' },
  // Serif
  { family: 'Merriweather', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'PT Serif', category: 'serif' },
  { family: 'Cormorant Garamond', category: 'serif' },
  { family: 'Libre Baskerville', category: 'serif' },
  // Handwriting
  { family: 'Dancing Script', category: 'handwriting' },
  { family: 'Pacifico', category: 'handwriting' },
  { family: 'Caveat', category: 'handwriting' },
  { family: 'Satisfy', category: 'handwriting' },
  { family: 'Sacramento', category: 'handwriting' },
  // Monospace
  { family: 'Fira Code', category: 'monospace' },
  { family: 'JetBrains Mono', category: 'monospace' },
  { family: 'Source Code Pro', category: 'monospace' },
];

// System fonts that don't need loading
export const SYSTEM_FONTS: string[] = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
  'Verdana', 'Courier New', 'Impact', 'Trebuchet MS',
  'Comic Sans MS', 'Roboto',
];

interface CustomFont {
  family: string;
  dataUrl: string;
}

const CUSTOM_FONTS_KEY = 'pixelforge_custom_fonts';
const MAX_CUSTOM_FONT_SIZE = 1.5 * 1024 * 1024; // 1.5 MB per font

@Injectable({ providedIn: 'root' })
export class FontService {
  private loadedFonts = new Set<string>();
  private readonly _isLoading = signal(false);
  private readonly _customFonts = signal<CustomFont[]>([]);

  readonly isLoading = this._isLoading.asReadonly();
  readonly customFonts = this._customFonts.asReadonly();

  constructor() {
    this.loadCustomFonts();
  }

  getAllFontFamilies(): string[] {
    return [
      ...this._customFonts().map(f => f.family),
      ...SYSTEM_FONTS,
      ...GOOGLE_FONTS.map(f => f.family),
    ];
  }

  /**
   * Upload a custom font file (.ttf, .otf, .woff, .woff2).
   * Loads it via FontFace API and persists to localStorage.
   */
  async uploadCustomFont(file: File): Promise<string> {
    if (file.size > MAX_CUSTOM_FONT_SIZE) {
      throw new Error('Font file too large (max 1.5MB)');
    }

    const acceptedExt = /\.(ttf|otf|woff|woff2)$/i;
    if (!acceptedExt.test(file.name)) {
      throw new Error('Unsupported font format. Use .ttf, .otf, .woff, or .woff2');
    }

    const family = file.name.replace(acceptedExt, '').trim();
    if (this._customFonts().some(f => f.family === family)) {
      throw new Error(`Font "${family}" is already loaded`);
    }

    const dataUrl = await this.fileToDataUrl(file);
    await this.registerFont(family, dataUrl);

    this._customFonts.update(fonts => [...fonts, { family, dataUrl }]);
    this.persistCustomFonts();

    return family;
  }

  removeCustomFont(family: string): void {
    this._customFonts.update(fonts => fonts.filter(f => f.family !== family));
    this.loadedFonts.delete(family);
    this.persistCustomFonts();
    // FontFace cleanup: there's no direct API to remove, but next reload will skip it
  }

  private async registerFont(family: string, dataUrl: string): Promise<void> {
    const fontFace = new FontFace(family, `url(${dataUrl})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    this.loadedFonts.add(family);
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async loadCustomFonts(): Promise<void> {
    try {
      const stored = localStorage.getItem(CUSTOM_FONTS_KEY);
      if (!stored) return;
      const fonts: CustomFont[] = JSON.parse(stored);
      this._customFonts.set(fonts);

      // Re-register each font with the browser
      for (const font of fonts) {
        try {
          await this.registerFont(font.family, font.dataUrl);
        } catch (e) {
          console.warn(`Failed to load custom font "${font.family}":`, e);
        }
      }
    } catch (e) {
      console.warn('Failed to load custom fonts:', e);
    }
  }

  private persistCustomFonts(): void {
    try {
      localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(this._customFonts()));
    } catch (e) {
      console.warn('Failed to persist custom fonts (storage full?):', e);
    }
  }

  getGoogleFonts(): FontEntry[] {
    return GOOGLE_FONTS;
  }

  async loadFont(family: string): Promise<void> {
    if (this.loadedFonts.has(family) || SYSTEM_FONTS.includes(family)) {
      return;
    }

    this._isLoading.set(true);

    try {
      const encodedFamily = family.replace(/ /g, '+');
      const linkId = `font-${encodedFamily}`;

      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);

        // Wait for font to load
        await document.fonts.ready;
      }

      this.loadedFonts.add(family);
    } catch (error) {
      console.warn(`Failed to load font: ${family}`, error);
    } finally {
      this._isLoading.set(false);
    }
  }

  async preloadPopularFonts(): Promise<void> {
    const popular = ['Inter', 'Poppins', 'Montserrat', 'Playfair Display', 'Lato', 'Oswald'];
    const families = popular.map(f => f.replace(/ /g, '+')).join('&family=');

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    document.head.appendChild(link);

    await document.fonts.ready;
    popular.forEach(f => this.loadedFonts.add(f));
  }
}
