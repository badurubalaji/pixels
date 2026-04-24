import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import * as fabric from 'fabric';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly canvasService = inject(CanvasService);
  private clipboardData: fabric.FabricObject | null = null;

  async copy(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active) return;

    this.clipboardData = await active.clone();
  }

  async paste(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas || !this.clipboardData) return;

    const cloned = await this.clipboardData.clone();
    cloned.set({
      left: (cloned.left ?? 0) + 20,
      top: (cloned.top ?? 0) + 20,
      evented: true,
    });

    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();

    // Offset for next paste
    this.clipboardData.set({
      left: (this.clipboardData.left ?? 0) + 20,
      top: (this.clipboardData.top ?? 0) + 20,
    });
  }

  async duplicate(): Promise<void> {
    await this.copy();
    await this.paste();
  }

  hasContent(): boolean {
    return this.clipboardData !== null;
  }

  // --- Copy/Paste Style ---
  private styleData: Record<string, any> | null = null;

  copyStyle(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    this.styleData = {
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity,
      shadow: obj.shadow ? (obj.shadow as fabric.Shadow).toObject() : null,
    };

    // Text-specific styles
    if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) {
      const t = obj as fabric.IText;
      this.styleData['fontSize'] = t.fontSize;
      this.styleData['fontFamily'] = t.fontFamily;
      this.styleData['fontWeight'] = t.fontWeight;
      this.styleData['fontStyle'] = t.fontStyle;
      this.styleData['underline'] = t.underline;
      this.styleData['linethrough'] = t.linethrough;
      this.styleData['charSpacing'] = t.charSpacing;
      this.styleData['lineHeight'] = t.lineHeight;
      this.styleData['textAlign'] = t.textAlign;
    }
  }

  pasteStyle(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !this.styleData) return;

    obj.set({
      fill: this.styleData['fill'],
      stroke: this.styleData['stroke'],
      strokeWidth: this.styleData['strokeWidth'],
      opacity: this.styleData['opacity'],
    });

    if (this.styleData['shadow']) {
      obj.shadow = new fabric.Shadow(this.styleData['shadow']);
    }

    // Apply text styles if target is text
    if ((obj instanceof fabric.IText || obj instanceof fabric.FabricText) && this.styleData['fontSize']) {
      obj.set({
        fontSize: this.styleData['fontSize'],
        fontFamily: this.styleData['fontFamily'],
        fontWeight: this.styleData['fontWeight'],
        fontStyle: this.styleData['fontStyle'],
        underline: this.styleData['underline'],
        linethrough: this.styleData['linethrough'],
        charSpacing: this.styleData['charSpacing'],
        lineHeight: this.styleData['lineHeight'],
        textAlign: this.styleData['textAlign'],
      } as any);
    }

    canvas!.renderAll();
  }

  hasStyle(): boolean {
    return this.styleData !== null;
  }
}
