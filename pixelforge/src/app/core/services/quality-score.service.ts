import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import { AccessibilityService } from './accessibility.service';
import * as fabric from 'fabric';

export interface QualityBreakdown {
  total: number;          // 0 - 100
  factors: QualityFactor[];
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface QualityFactor {
  name: string;
  score: number;    // 0-100
  weight: number;   // 0-1 (contribution)
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class QualityScoreService {
  private readonly canvasService = inject(CanvasService);
  private readonly a11y = inject(AccessibilityService);

  calculate(): QualityBreakdown {
    const canvas = this.canvasService.getCanvas();
    const factors: QualityFactor[] = [];

    if (!canvas) {
      return { total: 0, factors: [], grade: 'F' };
    }

    const objects = canvas.getObjects().filter(o => !(o as any)._isGuideline && !(o as any)._isGrid);

    if (objects.length === 0) {
      return { total: 0, factors: [{ name: 'Empty Canvas', score: 0, weight: 1, detail: 'Add some elements to start' }], grade: 'F' };
    }

    factors.push(this.evaluateContrast(objects));
    factors.push(this.evaluateAlignment(objects));
    factors.push(this.evaluateFontVariety(objects));
    factors.push(this.evaluateWhiteSpace(objects));
    factors.push(this.evaluateColorHarmony(objects));

    const total = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
    const grade = this.scoreToGrade(total);

    return { total, factors, grade };
  }

  private evaluateContrast(objects: fabric.FabricObject[]): QualityFactor {
    const textObjects = objects.filter(o => o instanceof fabric.IText || o instanceof fabric.FabricText);
    if (textObjects.length === 0) {
      return { name: 'Text Contrast', score: 100, weight: 0.25, detail: 'No text objects to evaluate' };
    }

    let passing = 0;
    for (const t of textObjects) {
      const fill = (t as any).fill;
      if (typeof fill !== 'string') { passing++; continue; }
      const bg = this.a11y.getEffectiveBackground(t);
      const result = this.a11y.contrastRatio(fill, bg);
      if (result.passAA) passing++;
    }

    const score = Math.round((passing / textObjects.length) * 100);
    return {
      name: 'Text Contrast',
      score,
      weight: 0.25,
      detail: score === 100
        ? 'All text passes WCAG AA'
        : `${textObjects.length - passing} of ${textObjects.length} text element(s) fail WCAG AA contrast`,
    };
  }

  private evaluateAlignment(objects: fabric.FabricObject[]): QualityFactor {
    if (objects.length < 2) {
      return { name: 'Alignment', score: 100, weight: 0.2, detail: 'Too few objects to measure alignment' };
    }

    // Reward objects that share common horizontal/vertical anchors
    const TOLERANCE = 6;
    const anchors = { left: 0, right: 0, centerH: 0, top: 0, bottom: 0, centerV: 0 };
    const total = objects.length;

    // Count objects sharing each anchor within tolerance
    for (let i = 0; i < objects.length; i++) {
      const a = objects[i].getBoundingRect();
      for (let j = i + 1; j < objects.length; j++) {
        const b = objects[j].getBoundingRect();
        if (Math.abs(a.left - b.left) < TOLERANCE) anchors.left++;
        if (Math.abs((a.left + a.width) - (b.left + b.width)) < TOLERANCE) anchors.right++;
        if (Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)) < TOLERANCE) anchors.centerH++;
        if (Math.abs(a.top - b.top) < TOLERANCE) anchors.top++;
        if (Math.abs((a.top + a.height) - (b.top + b.height)) < TOLERANCE) anchors.bottom++;
        if (Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) < TOLERANCE) anchors.centerV++;
      }
    }

    const totalPairs = (total * (total - 1)) / 2;
    const alignedPairs = Math.max(...Object.values(anchors));
    const score = Math.min(100, Math.round((alignedPairs / totalPairs) * 200));

    return {
      name: 'Alignment',
      score,
      weight: 0.2,
      detail: score >= 80
        ? 'Objects are nicely aligned'
        : score >= 40
        ? 'Some alignment — could be tighter'
        : 'Objects feel scattered. Try aligning them.',
    };
  }

  private evaluateFontVariety(objects: fabric.FabricObject[]): QualityFactor {
    const fonts = new Set<string>();
    for (const o of objects) {
      if (o instanceof fabric.IText || o instanceof fabric.FabricText) {
        fonts.add(((o as any).fontFamily ?? 'Arial') as string);
      }
    }

    let score: number;
    let detail: string;
    if (fonts.size === 0) {
      score = 100;
      detail = 'No text';
    } else if (fonts.size === 1) {
      score = 90;
      detail = 'Single font family — very clean';
    } else if (fonts.size === 2) {
      score = 100;
      detail = 'Ideal: 2 complementary fonts';
    } else if (fonts.size === 3) {
      score = 75;
      detail = '3 fonts is pushing it — consider reducing';
    } else {
      score = Math.max(30, 100 - fonts.size * 15);
      detail = `Too many fonts (${fonts.size}) — limit to 2-3`;
    }

    return { name: 'Font Variety', score, weight: 0.15, detail };
  }

  private evaluateWhiteSpace(objects: fabric.FabricObject[]): QualityFactor {
    const canvasW = this.canvasService.canvasWidth();
    const canvasH = this.canvasService.canvasHeight();
    const totalArea = canvasW * canvasH;

    let used = 0;
    for (const o of objects) {
      const b = o.getBoundingRect();
      used += b.width * b.height;
    }

    const ratio = Math.min(1, used / totalArea);
    let score: number;
    let detail: string;

    if (ratio < 0.15) {
      score = 60;
      detail = 'A lot of empty space — consider adding more content';
    } else if (ratio < 0.55) {
      score = 100;
      detail = 'Good balance of content and white space';
    } else if (ratio < 0.75) {
      score = 80;
      detail = 'Design is getting crowded';
    } else {
      score = 45;
      detail = 'Design is very crowded — add more breathing room';
    }

    return { name: 'White Space', score, weight: 0.2, detail };
  }

  private evaluateColorHarmony(objects: fabric.FabricObject[]): QualityFactor {
    const colors = new Set<string>();
    for (const o of objects) {
      const fill = (o as any).fill;
      if (typeof fill === 'string' && fill) colors.add(fill.toLowerCase());
    }

    const count = colors.size;
    let score: number;
    let detail: string;

    if (count <= 1) {
      score = 85;
      detail = 'Monochrome — very consistent';
    } else if (count <= 3) {
      score = 100;
      detail = 'Clean color palette';
    } else if (count <= 5) {
      score = 85;
      detail = 'Acceptable palette — keep under 5';
    } else {
      score = Math.max(40, 100 - (count - 5) * 10);
      detail = `Too many colors (${count}) — reduce to a tighter palette`;
    }

    return { name: 'Color Harmony', score, weight: 0.2, detail };
  }

  private scoreToGrade(score: number): QualityBreakdown['grade'] {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }
}
