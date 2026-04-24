import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import * as fabric from 'fabric';

export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface FontPairing {
  name: string;
  heading: string;
  body: string;
  vibe: string;
}

@Injectable({ providedIn: 'root' })
export class DesignHelperService {
  private readonly canvasService = inject(CanvasService);

  /**
   * Extract dominant colors from the selected image.
   * Returns up to 6 dominant colors using a simple sampling + bucketing approach.
   */
  async extractColorsFromSelection(): Promise<string[]> {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return [];

    const dataUrl = obj.toDataURL({ format: 'png', quality: 1, multiplier: 0.3 });
    const imgEl = await this.loadImage(dataUrl);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = imgEl.width;
    tmpCanvas.height = imgEl.height;
    const ctx = tmpCanvas.getContext('2d')!;
    ctx.drawImage(imgEl, 0, 0);

    const data = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;

    // Bucket colors by quantizing to 32-step grid
    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

    for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 200) continue;
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      const entry = buckets.get(key);
      if (entry) {
        entry.r += r; entry.g += g; entry.b += b; entry.n += 1;
      } else {
        buckets.set(key, { r, g, b, n: 1 });
      }
    }

    return Array.from(buckets.values())
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)
      .map(e => this.rgbToHex(Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)));
  }

  /**
   * Suggest complementary palettes based on a base color.
   */
  generatePalettesFrom(baseHex: string): ColorPalette[] {
    const base = this.hexToHsl(baseHex);
    if (!base) return [];

    return [
      {
        name: 'Monochromatic',
        colors: [
          this.hslToHex(base.h, base.s, Math.max(10, base.l - 30)),
          this.hslToHex(base.h, base.s, Math.max(20, base.l - 15)),
          baseHex,
          this.hslToHex(base.h, base.s, Math.min(85, base.l + 15)),
          this.hslToHex(base.h, base.s, Math.min(95, base.l + 30)),
        ],
      },
      {
        name: 'Complementary',
        colors: [
          baseHex,
          this.hslToHex(base.h, Math.max(15, base.s - 15), Math.min(85, base.l + 15)),
          this.hslToHex((base.h + 180) % 360, base.s, base.l),
          this.hslToHex((base.h + 180) % 360, Math.max(15, base.s - 15), Math.min(85, base.l + 15)),
        ],
      },
      {
        name: 'Triadic',
        colors: [
          baseHex,
          this.hslToHex((base.h + 120) % 360, base.s, base.l),
          this.hslToHex((base.h + 240) % 360, base.s, base.l),
        ],
      },
      {
        name: 'Analogous',
        colors: [
          this.hslToHex((base.h - 30 + 360) % 360, base.s, base.l),
          this.hslToHex((base.h - 15 + 360) % 360, base.s, base.l),
          baseHex,
          this.hslToHex((base.h + 15) % 360, base.s, base.l),
          this.hslToHex((base.h + 30) % 360, base.s, base.l),
        ],
      },
    ];
  }

  /**
   * Pre-curated font pairings for different design styles.
   */
  getFontPairings(): FontPairing[] {
    return [
      { name: 'Modern Editorial', heading: 'Playfair Display', body: 'Inter', vibe: 'Sophisticated · magazine-style' },
      { name: 'Tech Startup', heading: 'Space Grotesk', body: 'Inter', vibe: 'Clean · contemporary' },
      { name: 'Classic Print', heading: 'Merriweather', body: 'Lato', vibe: 'Trustworthy · readable' },
      { name: 'Bold Display', heading: 'Bungee', body: 'Roboto', vibe: 'High-impact · loud' },
      { name: 'Friendly', heading: 'Poppins', body: 'Open Sans', vibe: 'Approachable · soft' },
      { name: 'Luxury Brand', heading: 'Cormorant Garamond', body: 'Montserrat', vibe: 'Premium · refined' },
      { name: 'Handwritten', heading: 'Pacifico', body: 'Lora', vibe: 'Personal · warm' },
      { name: 'Minimalist', heading: 'DM Sans', body: 'DM Sans', vibe: 'Quiet · neutral' },
      { name: 'Vintage Poster', heading: 'Abril Fatface', body: 'PT Serif', vibe: 'Retro · expressive' },
      { name: 'Tech Mono', heading: 'Space Grotesk', body: 'JetBrains Mono', vibe: 'Developer · technical' },
    ];
  }

  // --- Color math helpers ---

  private hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return null;
    const r = parseInt(m[1], 16) / 255;
    const g = parseInt(m[2], 16) / 255;
    const b = parseInt(m[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return this.rgbToHex(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}
