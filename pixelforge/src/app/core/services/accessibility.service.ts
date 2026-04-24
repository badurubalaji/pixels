import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import * as fabric from 'fabric';

export interface ContrastResult {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  passAALarge: boolean;
}

export interface AuditIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'contrast' | 'small-text' | 'overflow' | 'missing-alt' | 'tap-target';
  message: string;
  fix?: string;
  objectId?: string;
}

const MIN_TEXT_SIZE = 12; // px
const MIN_TAP_TARGET = 24; // px (in design units)

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private readonly canvasService = inject(CanvasService);

  /** Compute WCAG 2.1 contrast ratio between two colors. */
  contrastRatio(fgHex: string, bgHex: string): ContrastResult {
    const l1 = this.relativeLuminance(fgHex);
    const l2 = this.relativeLuminance(bgHex);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7,
      passAALarge: ratio >= 3,
    };
  }

  /** Get the effective background under an object: canvas bg or topmost shape behind it. */
  getEffectiveBackground(obj: fabric.FabricObject): string {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return '#ffffff';

    const bound = obj.getBoundingRect();
    const cx = bound.left + bound.width / 2;
    const cy = bound.top + bound.height / 2;

    // Look for any shape behind this object that overlaps its center
    const all = canvas.getObjects();
    const idx = all.indexOf(obj);
    for (let i = idx - 1; i >= 0; i--) {
      const other = all[i];
      if ((other as any)._isGuideline || (other as any)._isGrid) continue;
      const ob = other.getBoundingRect();
      if (cx >= ob.left && cx <= ob.left + ob.width && cy >= ob.top && cy <= ob.top + ob.height) {
        if (typeof other.fill === 'string' && other.fill) {
          return other.fill;
        }
      }
    }

    return typeof canvas.backgroundColor === 'string' ? canvas.backgroundColor || '#ffffff' : '#ffffff';
  }

  /** Run a full accessibility audit on the canvas. */
  audit(): AuditIssue[] {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return [];

    const issues: AuditIssue[] = [];

    for (const obj of canvas.getObjects()) {
      if ((obj as any)._isGuideline || (obj as any)._isGrid) continue;
      const id = (obj as any).layerId ?? '';

      // Text checks
      if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) {
        const t = obj as fabric.IText;
        const renderedSize = (t.fontSize ?? 16) * (t.scaleY ?? 1);

        // Small text
        if (renderedSize < MIN_TEXT_SIZE) {
          issues.push({
            id: `${id}-size`,
            severity: 'warning',
            category: 'small-text',
            message: `Text "${(t.text ?? '').slice(0, 25)}" is only ${Math.round(renderedSize)}px (below 12px minimum)`,
            fix: 'Increase font size to at least 12px',
            objectId: id,
          });
        }

        // Contrast
        if (typeof t.fill === 'string') {
          const bg = this.getEffectiveBackground(t);
          const result = this.contrastRatio(t.fill, bg);
          const isLargeText = renderedSize >= 18 || (renderedSize >= 14 && (t.fontWeight === 'bold' || t.fontWeight === 700));

          if ((isLargeText && !result.passAALarge) || (!isLargeText && !result.passAA)) {
            issues.push({
              id: `${id}-contrast`,
              severity: 'error',
              category: 'contrast',
              message: `"${(t.text ?? '').slice(0, 25)}" has low contrast (${result.ratio}:1) — fails WCAG AA`,
              fix: 'Use a darker fill or change the background',
              objectId: id,
            });
          } else if (!isLargeText && !result.passAAA) {
            issues.push({
              id: `${id}-contrast-aaa`,
              severity: 'info',
              category: 'contrast',
              message: `"${(t.text ?? '').slice(0, 25)}" passes AA but not AAA (${result.ratio}:1)`,
              objectId: id,
            });
          }
        }
      }

      // Image: missing alt
      if (obj instanceof fabric.FabricImage) {
        const altText = (obj as any).altText;
        if (!altText) {
          issues.push({
            id: `${id}-alt`,
            severity: 'warning',
            category: 'missing-alt',
            message: 'Image is missing alt text description',
            fix: 'Add alt text in image properties',
            objectId: id,
          });
        }
      }

      // Tiny tap targets (interactive shapes)
      const bound = obj.getBoundingRect();
      const minDim = Math.min(bound.width, bound.height);
      if (obj instanceof fabric.Rect || obj instanceof fabric.Circle) {
        if (minDim < MIN_TAP_TARGET && minDim > 0) {
          issues.push({
            id: `${id}-tap`,
            severity: 'info',
            category: 'tap-target',
            message: `Element is very small (${Math.round(minDim)}px) — hard to tap on mobile`,
            objectId: id,
          });
        }
      }
    }

    return issues;
  }

  // --- color math ---

  private relativeLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const lin = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (m) {
      return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16),
      };
    }
    const m2 = hex.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    if (m2) {
      return {
        r: parseInt(m2[1] + m2[1], 16),
        g: parseInt(m2[2] + m2[2], 16),
        b: parseInt(m2[3] + m2[3], 16),
      };
    }
    const rgbMatch = hex.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
    }
    return null;
  }
}
