import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';

interface PaletteEntry {
  keywords: string[];
  colors: string[];
}

const PALETTES: PaletteEntry[] = [
  { keywords: ['ocean', 'sea', 'water', 'beach', 'wave', 'aqua', 'blue'], colors: ['#0077be', '#00a8cc', '#7fdbff'] },
  { keywords: ['sunset', 'orange', 'warm', 'fire', 'flame'], colors: ['#ff6b35', '#f7931e', '#ffd23f'] },
  { keywords: ['forest', 'nature', 'green', 'leaf', 'plant', 'mint'], colors: ['#11998e', '#38ef7d', '#a8e063'] },
  { keywords: ['night', 'dark', 'space', 'galaxy', 'cosmic', 'midnight'], colors: ['#0f0c29', '#302b63', '#24243e'] },
  { keywords: ['rose', 'pink', 'romantic', 'love', 'flower'], colors: ['#ee9ca7', '#ffdde1', '#ff6f91'] },
  { keywords: ['gold', 'luxury', 'premium', 'rich', 'royal'], colors: ['#f2994a', '#f2c94c', '#d4af37'] },
  { keywords: ['retro', 'vintage', '80s', 'neon', 'synthwave'], colors: ['#ff006e', '#8338ec', '#3a86ff'] },
  { keywords: ['pastel', 'soft', 'cream', 'gentle'], colors: ['#fce1e4', '#fcd5ce', '#f9dcc4'] },
  { keywords: ['monochrome', 'gray', 'minimal', 'mono'], colors: ['#1a1a1a', '#525252', '#a3a3a3'] },
  { keywords: ['tropical', 'jungle', 'exotic', 'palm'], colors: ['#06ffa5', '#ffbe0b', '#fb5607'] },
  { keywords: ['arctic', 'ice', 'cold', 'winter', 'snow'], colors: ['#e0eafc', '#cfdef3', '#a8b5c8'] },
  { keywords: ['autumn', 'fall', 'leaves', 'rust', 'amber'], colors: ['#d35400', '#e67e22', '#f39c12'] },
];

const GENERATION_TYPES = ['gradient-linear', 'gradient-radial', 'mesh', 'dots', 'waves'] as const;
type GenType = typeof GENERATION_TYPES[number];

@Injectable({ providedIn: 'root' })
export class AiBackgroundService {
  private readonly canvasService = inject(CanvasService);

  /**
   * Generate a background image from a text prompt.
   * Returns SVG data URL.
   */
  generate(prompt: string): string {
    const colors = this.matchPalette(prompt);
    const type = this.detectType(prompt);

    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    const svg = this.buildSvg(type, colors, w, h);
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  generateAndApply(prompt: string): void {
    const dataUrl = this.generate(prompt);
    this.canvasService.setBackgroundImage(dataUrl, 'cover');
  }

  private matchPalette(prompt: string): string[] {
    const p = prompt.toLowerCase();

    for (const palette of PALETTES) {
      if (palette.keywords.some(k => p.includes(k))) {
        return palette.colors;
      }
    }

    // Default: pick a random palette
    const random = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    return random.colors;
  }

  private detectType(prompt: string): GenType {
    const p = prompt.toLowerCase();
    if (p.includes('mesh') || p.includes('blur')) return 'mesh';
    if (p.includes('dot') || p.includes('pattern')) return 'dots';
    if (p.includes('wave') || p.includes('flow')) return 'waves';
    if (p.includes('radial') || p.includes('sun') || p.includes('glow')) return 'gradient-radial';
    if (p.includes('linear') || p.includes('gradient')) return 'gradient-linear';

    // Random by default
    return GENERATION_TYPES[Math.floor(Math.random() * GENERATION_TYPES.length)];
  }

  private buildSvg(type: GenType, colors: string[], w: number, h: number): string {
    const angle = Math.floor(Math.random() * 360);

    let content = '';
    const defs: string[] = [];

    switch (type) {
      case 'gradient-linear': {
        const stops = colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('');
        defs.push(`<linearGradient id="g" gradientTransform="rotate(${angle})">${stops}</linearGradient>`);
        content = `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
        break;
      }
      case 'gradient-radial': {
        const stops = colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('');
        defs.push(`<radialGradient id="g" cx="50%" cy="50%">${stops}</radialGradient>`);
        content = `<rect width="${w}" height="${h}" fill="url(#g)"/>`;
        break;
      }
      case 'mesh': {
        // Multiple radial gradients overlapping
        defs.push(`<filter id="b"><feGaussianBlur stdDeviation="80"/></filter>`);
        const blobs: string[] = [`<rect width="${w}" height="${h}" fill="${colors[0]}"/>`];
        for (let i = 1; i < colors.length + 2; i++) {
          const cx = Math.random() * w;
          const cy = Math.random() * h;
          const r = Math.min(w, h) * (0.3 + Math.random() * 0.4);
          const c = colors[i % colors.length];
          blobs.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="0.7"/>`);
        }
        content = `<g filter="url(#b)">${blobs.join('')}</g>`;
        break;
      }
      case 'dots': {
        const stops = colors.slice(0, 2).map((c, i) => `<stop offset="${i * 100}%" stop-color="${c}"/>`).join('');
        defs.push(`<linearGradient id="g" gradientTransform="rotate(${angle})">${stops}</linearGradient>`);
        const dots: string[] = [`<rect width="${w}" height="${h}" fill="url(#g)"/>`];
        const dotColor = colors[2] || colors[0];
        const spacing = 40;
        for (let x = spacing / 2; x < w; x += spacing) {
          for (let y = spacing / 2; y < h; y += spacing) {
            dots.push(`<circle cx="${x}" cy="${y}" r="3" fill="${dotColor}" opacity="0.4"/>`);
          }
        }
        content = dots.join('');
        break;
      }
      case 'waves': {
        const stops = colors.map((c, i) => `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${c}"/>`).join('');
        defs.push(`<linearGradient id="g" gradientTransform="rotate(${angle})">${stops}</linearGradient>`);
        const paths: string[] = [`<rect width="${w}" height="${h}" fill="url(#g)"/>`];
        for (let i = 0; i < 4; i++) {
          const yOffset = h * (0.2 + i * 0.2);
          const amp = 60 + Math.random() * 40;
          const freq = 4;
          let d = `M 0 ${yOffset}`;
          for (let x = 0; x <= w; x += w / 20) {
            const y = yOffset + Math.sin((x / w) * Math.PI * freq) * amp;
            d += ` L ${x} ${y}`;
          }
          d += ` L ${w} ${h} L 0 ${h} Z`;
          paths.push(`<path d="${d}" fill="${colors[i % colors.length]}" opacity="0.4"/>`);
        }
        content = paths.join('');
        break;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs.join('')}</defs>${content}</svg>`;
  }
}
