import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import { FontService } from './font.service';
import * as fabric from 'fabric';

export type StyleVariant = 'minimal' | 'bold' | 'vintage' | 'modern' | 'playful';

export interface StylePreset {
  id: StyleVariant;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  palette: { bg: string; primary: string; secondary: string; text: string; accent: string };
  textShadow?: boolean;
  strokeWidth: number;
}

export const STYLE_PRESETS: Record<StyleVariant, StylePreset> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, quiet, maximum white space',
    headingFont: 'DM Sans',
    bodyFont: 'DM Sans',
    palette: { bg: '#ffffff', primary: '#111827', secondary: '#6b7280', text: '#111827', accent: '#3b82f6' },
    strokeWidth: 0,
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'High impact, dramatic contrast',
    headingFont: 'Bungee',
    bodyFont: 'Inter',
    palette: { bg: '#0f172a', primary: '#fbbf24', secondary: '#ef4444', text: '#ffffff', accent: '#ef4444' },
    textShadow: true,
    strokeWidth: 0,
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    description: 'Warm tones, serif fonts',
    headingFont: 'Playfair Display',
    bodyFont: 'Lora',
    palette: { bg: '#faf3e7', primary: '#8b4513', secondary: '#c17817', text: '#3a2414', accent: '#c17817' },
    strokeWidth: 0,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Tech-forward, geometric',
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
    palette: { bg: '#0f0c29', primary: '#7c3aed', secondary: '#06b6d4', text: '#ffffff', accent: '#06b6d4' },
    strokeWidth: 0,
  },
  playful: {
    id: 'playful',
    name: 'Playful',
    description: 'Round, bright, energetic',
    headingFont: 'Poppins',
    bodyFont: 'Poppins',
    palette: { bg: '#fef3c7', primary: '#ec4899', secondary: '#7c3aed', text: '#831843', accent: '#f59e0b' },
    strokeWidth: 0,
  },
};

@Injectable({ providedIn: 'root' })
export class StyleVariationsService {
  private readonly canvasService = inject(CanvasService);
  private readonly fontService = inject(FontService);

  getAllStyles(): StylePreset[] {
    return Object.values(STYLE_PRESETS);
  }

  /**
   * Apply a style preset to the current design.
   * Swaps fonts, colors, and applies the style palette consistently.
   */
  async applyStyle(variant: StyleVariant): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;
    const preset = STYLE_PRESETS[variant];

    // Preload fonts
    await Promise.all([
      this.fontService.loadFont(preset.headingFont),
      this.fontService.loadFont(preset.bodyFont),
    ]);

    // Apply background
    canvas.backgroundColor = preset.palette.bg;

    const objects = canvas.getObjects().filter(o => !(o as any)._isGuideline && !(o as any)._isGrid);

    // Separate texts by size: largest == heading, rest == body
    const textObjects = objects.filter(o => o instanceof fabric.IText || o instanceof fabric.FabricText);
    const sortedBySize = [...textObjects].sort((a, b) => {
      return ((b as fabric.IText).fontSize ?? 0) - ((a as fabric.IText).fontSize ?? 0);
    });

    sortedBySize.forEach((obj, index) => {
      const t = obj as fabric.IText;
      const isHeading = index === 0 || (sortedBySize.length > 1 && index < Math.max(1, sortedBySize.length / 3));

      t.set({
        fontFamily: isHeading ? preset.headingFont : preset.bodyFont,
        fill: isHeading ? preset.palette.primary : preset.palette.text,
      });

      if (preset.textShadow && isHeading) {
        t.shadow = new fabric.Shadow({
          color: 'rgba(0,0,0,0.4)',
          blur: 8, offsetX: 0, offsetY: 3,
        });
      } else {
        t.shadow = null;
      }
    });

    // Apply palette to shapes
    const shapeObjects = objects.filter(o =>
      !(o instanceof fabric.IText) && !(o instanceof fabric.FabricText) && !(o instanceof fabric.FabricImage)
    );

    shapeObjects.forEach((obj, index) => {
      const colors = [preset.palette.primary, preset.palette.secondary, preset.palette.accent];
      obj.set({
        fill: colors[index % colors.length],
        stroke: preset.strokeWidth > 0 ? preset.palette.text : '',
        strokeWidth: preset.strokeWidth,
      });
    });

    canvas.renderAll();
  }
}
