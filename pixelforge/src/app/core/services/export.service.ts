import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import { AnimationService } from './animation.service';
import { ExportOptions } from '../models/project.model';
import { saveAs } from 'file-saver';
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, degrees } from 'pdf-lib';
import * as fabric from 'fabric';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly canvasService = inject(CanvasService);
  private readonly animationService = inject(AnimationService);

  /**
   * Run an export callback with the canvas restored to its full design
   * dimensions at 1× zoom, so exports always capture the complete design
   * regardless of the user's current zoom level. Restores the user's
   * zoom/pan afterwards.
   */
  private withIdentityViewport<T>(fn: () => T): T {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return fn();

    const designW = this.canvasService.canvasWidth();
    const designH = this.canvasService.canvasHeight();
    const savedVpt = canvas.viewportTransform ? [...canvas.viewportTransform] as [number, number, number, number, number, number] : null;
    const savedZoom = canvas.getZoom();
    const savedWidth = canvas.getWidth();
    const savedHeight = canvas.getHeight();

    // Resize canvas to design dimensions at 1× zoom so exports capture full size
    canvas.setDimensions({ width: designW, height: designH });
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.setZoom(1);
    canvas.renderAll();

    try {
      return fn();
    } finally {
      canvas.setDimensions({ width: savedWidth, height: savedHeight });
      canvas.setZoom(savedZoom);
      if (savedVpt) canvas.setViewportTransform(savedVpt);
      canvas.renderAll();
    }
  }

  /**
   * Render the canvas to a data URL with the viewport reset to identity.
   * Async variant for when the caller needs a Promise.
   */
  private async withIdentityViewportAsync<T>(fn: () => Promise<T>): Promise<T> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return fn();

    const savedVpt = canvas.viewportTransform ? [...canvas.viewportTransform] as [number, number, number, number, number, number] : null;
    const savedZoom = canvas.getZoom();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();

    try {
      return await fn();
    } finally {
      if (savedVpt) canvas.setViewportTransform(savedVpt);
      else canvas.setZoom(savedZoom);
      canvas.renderAll();
    }
  }

  /**
   * Batch export the current design in multiple sizes as a ZIP file.
   * Uses magic-resize to adapt content for each target size.
   */
  async exportBatchSizes(
    fileName: string,
    sizes: { name: string; width: number; height: number }[],
    format: 'png' | 'jpeg' | 'webp' = 'png',
    onProgress?: (p: number, current: string) => void,
  ): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas || sizes.length === 0) return;

    // Save original state
    const originalJson = this.canvasService.getCanvasJSON();
    const originalWidth = this.canvasService.canvasWidth();
    const originalHeight = this.canvasService.canvasHeight();

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    try {
      for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        onProgress?.(i / sizes.length, size.name);

        // Reload original each time, then magic-resize
        await this.canvasService.loadFromJSON(originalJson);
        await new Promise(resolve => setTimeout(resolve, 80));
        this.canvasService.magicResize(size.width, size.height);
        await new Promise(resolve => setTimeout(resolve, 80));

        const dataUrl = canvas.toDataURL({ format, quality: 0.92, multiplier: 1 });
        const base64 = dataUrl.split(',')[1];
        const safeName = size.name.replace(/[^a-z0-9-_]+/gi, '_');
        zip.file(`${fileName}-${safeName}-${size.width}x${size.height}.${format}`, base64, { base64: true });
      }

      onProgress?.(1, 'Packaging...');
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${fileName}-batch.zip`);
    } finally {
      // Restore original
      this.canvasService.resizeCanvasWithScale(originalWidth, originalHeight, false);
      await this.canvasService.loadFromJSON(originalJson);
    }
  }

  /**
   * Export a video (WebM) from the canvas, including object animations.
   * Uses MediaRecorder to capture the canvas stream.
   */
  async exportVideo(
    fileName: string,
    durationSeconds: number = 5,
    fps: number = 30,
    onProgress?: (p: number) => void,
  ): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    // Pick best supported MIME type
    const mimeCandidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    const mimeType = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      throw new Error('Browser does not support video recording');
    }

    const canvasEl = canvas.getElement() as HTMLCanvasElement;
    const stream = canvasEl.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return new Promise<void>(async (resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        saveAs(blob, `${fileName}.${ext}`);
        resolve();
      };
      recorder.onerror = (e) => reject(e);

      recorder.start();

      try {
        // Play animations once
        await this.animationService.playAll();

        // Hold the final frame for the remaining duration
        const elapsed = Date.now();
        const totalMs = durationSeconds * 1000;
        const animationMs = 2500; // approximate max animation time
        const remaining = Math.max(500, totalMs - animationMs);

        const tickStart = Date.now();
        const interval = setInterval(() => {
          canvas.requestRenderAll();
          const t = (Date.now() - tickStart) / remaining;
          onProgress?.(Math.min(1, t));
          if (t >= 1) {
            clearInterval(interval);
            recorder.stop();
          }
        }, 1000 / fps);
      } catch (e) {
        recorder.stop();
        reject(e);
      }
    });
  }

  /**
   * Export an animated GIF cycling through all project pages.
   * @param pages All pages to include
   * @param frameDelay Milliseconds per frame
   * @param currentPageJson Current canvas state (to restore after export)
   * @param onProgress Callback (0-1) for progress
   */
  async exportAnimatedGIF(
    fileName: string,
    pages: { canvasJson: string }[],
    frameDelay: number,
    currentPageJson: string,
    onProgress?: (p: number) => void,
  ): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas || pages.length === 0) return;

    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    // Dynamic import to keep initial bundle small
    const GIF = (await import('gif.js')).default;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: w,
      height: h,
      workerScript: '/gif.worker.js',
    });

    for (let i = 0; i < pages.length; i++) {
      if (pages[i].canvasJson) {
        await this.canvasService.loadFromJSON(pages[i].canvasJson);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Capture as data URL → image element for gif.js
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = dataUrl;
      });

      gif.addFrame(img, { delay: frameDelay, copy: true });
    }

    // Restore current page
    if (currentPageJson) {
      await this.canvasService.loadFromJSON(currentPageJson);
    }

    return new Promise<void>((resolve, reject) => {
      gif.on('progress', (p: number) => onProgress?.(p));
      gif.on('finished', (blob: Blob) => {
        saveAs(blob, `${fileName}.gif`);
        resolve();
      });
      gif.on('abort', () => reject(new Error('GIF render aborted')));
      gif.render();
    });
  }

  /**
   * Export current canvas as a vector PDF — text remains selectable/searchable,
   * shapes are vectors, images are embedded properly. NOT a rasterized image.
   */
  async exportPDF(fileName: string): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    await this.withIdentityViewportAsync(async () => {
      const w = this.canvasService.canvasWidth();
      const h = this.canvasService.canvasHeight();

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([w, h]);

      // Embed standard fonts (used as fallbacks)
      const fonts = await this.embedStandardFonts(pdfDoc);

      // Background color
      const bg = canvas.backgroundColor;
      if (bg && typeof bg === 'string' && bg !== 'transparent' && bg !== '') {
        const c = this.parseColor(bg);
        if (c) {
          page.drawRectangle({
            x: 0, y: 0, width: w, height: h,
            color: rgb(c.r, c.g, c.b),
          });
        }
      }

      // Render each fabric object
      for (const obj of canvas.getObjects()) {
        if ((obj as any)._isGuideline || (obj as any)._isGrid) continue;
        await this.renderObjectToPdf(obj, page, pdfDoc, fonts, h);
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `${fileName}.pdf`);
    });
  }

  /**
   * Export multiple pages as a single vector PDF.
   */
  async exportMultiPagePDF(
    fileName: string,
    pages: { canvasJson: string }[],
    currentPageJson: string,
  ): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas || pages.length === 0) return;

    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    const pdfDoc = await PDFDocument.create();
    const fonts = await this.embedStandardFonts(pdfDoc);

    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      if (pageData.canvasJson) {
        await this.canvasService.loadFromJSON(pageData.canvasJson);
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      const pdfPage = pdfDoc.addPage([w, h]);

      // Background
      const bg = canvas.backgroundColor;
      if (bg && typeof bg === 'string' && bg !== 'transparent' && bg !== '') {
        const c = this.parseColor(bg);
        if (c) {
          pdfPage.drawRectangle({
            x: 0, y: 0, width: w, height: h,
            color: rgb(c.r, c.g, c.b),
          });
        }
      }

      for (const obj of canvas.getObjects()) {
        if ((obj as any)._isGuideline || (obj as any)._isGrid) continue;
        await this.renderObjectToPdf(obj, pdfPage, pdfDoc, fonts, h);
      }
    }

    // Restore current page
    if (currentPageJson) {
      await this.canvasService.loadFromJSON(currentPageJson);
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    saveAs(blob, `${fileName}.pdf`);
  }

  // --- PDF rendering helpers ---

  private async embedStandardFonts(pdfDoc: PDFDocument): Promise<{
    regular: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont;
    serif: PDFFont; serifBold: PDFFont; mono: PDFFont;
  }> {
    return {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
      serif: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      serifBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      mono: await pdfDoc.embedFont(StandardFonts.Courier),
    };
  }

  private async renderObjectToPdf(
    obj: fabric.FabricObject,
    page: PDFPage,
    pdfDoc: PDFDocument,
    fonts: any,
    canvasHeight: number,
  ): Promise<void> {
    if (!obj.visible) return;

    if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) {
      await this.renderTextToPdf(obj as fabric.IText, page, fonts, canvasHeight);
    } else if (obj instanceof fabric.FabricImage) {
      await this.renderImageToPdf(obj, page, pdfDoc, canvasHeight);
    } else if (obj instanceof fabric.Rect) {
      this.renderRectToPdf(obj, page, canvasHeight);
    } else if (obj instanceof fabric.Circle) {
      this.renderCircleToPdf(obj, page, canvasHeight);
    } else if (obj instanceof fabric.Line) {
      this.renderLineToPdf(obj, page, canvasHeight);
    } else if (obj instanceof fabric.Group) {
      // Render group as image fallback (preserves complex transforms)
      await this.renderGenericToPdf(obj, page, pdfDoc, canvasHeight);
    } else {
      // Fallback: rasterize this single object into PDF
      await this.renderGenericToPdf(obj, page, pdfDoc, canvasHeight);
    }
  }

  private async renderTextToPdf(
    obj: fabric.IText, page: PDFPage, fonts: any, canvasHeight: number,
  ): Promise<void> {
    const text = obj.text ?? '';
    if (!text) return;

    const fontSize = (obj.fontSize ?? 16) * (obj.scaleY ?? 1);
    const family = (obj.fontFamily ?? '').toLowerCase();
    const isBold = obj.fontWeight === 'bold' || obj.fontWeight === 700 || (typeof obj.fontWeight === 'number' && obj.fontWeight >= 600);
    const isItalic = obj.fontStyle === 'italic';

    let font: PDFFont;
    if (family.includes('times') || family.includes('serif') || family.includes('georgia')) {
      font = isBold ? fonts.serifBold : fonts.serif;
    } else if (family.includes('courier') || family.includes('mono')) {
      font = fonts.mono;
    } else {
      if (isBold && isItalic) font = fonts.boldItalic;
      else if (isBold) font = fonts.bold;
      else if (isItalic) font = fonts.italic;
      else font = fonts.regular;
    }

    const color = this.parseColor(typeof obj.fill === 'string' ? obj.fill : '#000000') ?? { r: 0, g: 0, b: 0 };

    // Fabric uses left/top origin; PDF uses left/bottom origin
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const angle = obj.angle ?? 0;
    const opacity = obj.opacity ?? 1;

    // Adjust for text origin (Fabric IText origin is typically 'left'/'top')
    const originX = obj.originX ?? 'left';
    const originY = obj.originY ?? 'top';

    const lines = text.split('\n');
    const lineHeight = fontSize * (obj.lineHeight ?? 1.16);

    let totalWidth = 0;
    for (const line of lines) {
      const w = font.widthOfTextAtSize(line, fontSize);
      if (w > totalWidth) totalWidth = w;
    }
    const totalHeight = lines.length * lineHeight;

    let baseX = left;
    let baseY = top;

    if (originX === 'center') baseX -= totalWidth / 2;
    else if (originX === 'right') baseX -= totalWidth;

    if (originY === 'center') baseY -= totalHeight / 2;
    else if (originY === 'bottom') baseY -= totalHeight;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWidth = font.widthOfTextAtSize(line, fontSize);
      let xOffset = 0;
      const align = obj.textAlign ?? 'left';
      if (align === 'center') xOffset = (totalWidth - lineWidth) / 2;
      else if (align === 'right') xOffset = totalWidth - lineWidth;

      const x = baseX + xOffset;
      // pdf-lib places text at its BASELINE. Fabric renders text from the top
      // of its bounding box. The baseline sits at approximately (line top +
      // ascent), where ascent ≈ 0.75 × fontSize for Helvetica/Times.
      // PDF y-axis is bottom-up, so flip through canvasHeight.
      const lineTop = baseY + i * lineHeight;
      const ascent = fontSize * 0.75;
      const yPdf = canvasHeight - (lineTop + ascent);

      try {
        page.drawText(line, {
          x,
          y: yPdf,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity,
          rotate: angle ? degrees(-angle) : undefined,
        });
      } catch (e) {
        // Fallback if character is unsupported
        const safe = line.replace(/[^\x20-\x7E\n\r\t]/g, '?');
        try {
          page.drawText(safe, {
            x, y: yPdf, size: fontSize, font,
            color: rgb(color.r, color.g, color.b), opacity,
          });
        } catch {}
      }
    }
  }

  private async renderImageToPdf(
    obj: fabric.FabricImage, page: PDFPage, pdfDoc: PDFDocument, canvasHeight: number,
  ): Promise<void> {
    try {
      const dataUrl = obj.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
      const base64 = dataUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      const image = await pdfDoc.embedPng(bytes);

      const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
      const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
      const left = obj.left ?? 0;
      const top = obj.top ?? 0;

      const originX = obj.originX ?? 'left';
      const originY = obj.originY ?? 'top';

      let x = left;
      let yTop = top;
      if (originX === 'center') x -= w / 2;
      else if (originX === 'right') x -= w;
      if (originY === 'center') yTop -= h / 2;
      else if (originY === 'bottom') yTop -= h;

      const yPdf = canvasHeight - yTop - h;

      page.drawImage(image, {
        x, y: yPdf, width: w, height: h,
        opacity: obj.opacity ?? 1,
        rotate: obj.angle ? degrees(-(obj.angle ?? 0)) : undefined,
      });
    } catch (e) {
      console.warn('Failed to embed image in PDF:', e);
    }
  }

  private renderRectToPdf(obj: fabric.Rect, page: PDFPage, canvasHeight: number): void {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;

    const originX = obj.originX ?? 'left';
    const originY = obj.originY ?? 'top';
    let x = left;
    let yTop = top;
    if (originX === 'center') x -= w / 2;
    else if (originX === 'right') x -= w;
    if (originY === 'center') yTop -= h / 2;
    else if (originY === 'bottom') yTop -= h;

    const yPdf = canvasHeight - yTop - h;

    const fill = this.parseColor(typeof obj.fill === 'string' ? obj.fill : '');
    const stroke = this.parseColor(typeof obj.stroke === 'string' ? obj.stroke : '');

    page.drawRectangle({
      x, y: yPdf, width: w, height: h,
      color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
      borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
      borderWidth: obj.strokeWidth ?? 0,
      opacity: obj.opacity ?? 1,
      rotate: obj.angle ? degrees(-(obj.angle ?? 0)) : undefined,
    });
  }

  private renderCircleToPdf(obj: fabric.Circle, page: PDFPage, canvasHeight: number): void {
    const r = (obj.radius ?? 0) * (obj.scaleX ?? 1);
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const originX = obj.originX ?? 'left';
    const originY = obj.originY ?? 'top';

    let cx = left + r;
    let cy = top + r;
    if (originX === 'center') cx = left;
    else if (originX === 'right') cx = left - r;
    if (originY === 'center') cy = top;
    else if (originY === 'bottom') cy = top - r;

    const yPdf = canvasHeight - cy;

    const fill = this.parseColor(typeof obj.fill === 'string' ? obj.fill : '');
    const stroke = this.parseColor(typeof obj.stroke === 'string' ? obj.stroke : '');

    page.drawCircle({
      x: cx, y: yPdf, size: r,
      color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
      borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
      borderWidth: obj.strokeWidth ?? 0,
      opacity: obj.opacity ?? 1,
    });
  }

  private renderLineToPdf(obj: fabric.Line, page: PDFPage, canvasHeight: number): void {
    const x1 = (obj as any).x1 ?? 0;
    const y1 = (obj as any).y1 ?? 0;
    const x2 = (obj as any).x2 ?? 0;
    const y2 = (obj as any).y2 ?? 0;
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;

    const stroke = this.parseColor(typeof obj.stroke === 'string' ? obj.stroke : '#000000') ?? { r: 0, g: 0, b: 0 };

    page.drawLine({
      start: { x: left + x1, y: canvasHeight - (top + y1) },
      end: { x: left + x2, y: canvasHeight - (top + y2) },
      thickness: obj.strokeWidth ?? 1,
      color: rgb(stroke.r, stroke.g, stroke.b),
      opacity: obj.opacity ?? 1,
    });
  }

  /** Fallback: rasterize this single object and embed as image. */
  private async renderGenericToPdf(
    obj: fabric.FabricObject, page: PDFPage, pdfDoc: PDFDocument, canvasHeight: number,
  ): Promise<void> {
    try {
      const dataUrl = obj.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
      const base64 = dataUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const image = await pdfDoc.embedPng(bytes);

      const bound = obj.getBoundingRect();
      const yPdf = canvasHeight - bound.top - bound.height;

      page.drawImage(image, {
        x: bound.left,
        y: yPdf,
        width: bound.width,
        height: bound.height,
        opacity: obj.opacity ?? 1,
      });
    } catch (e) {
      console.warn('Failed to render object to PDF:', e);
    }
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    if (!color || color === 'transparent') return null;

    // hex
    if (color.startsWith('#')) {
      let hex = color.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length !== 6 && hex.length !== 8) return null;
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b };
    }

    // rgb / rgba
    const rgbMatch = color.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]) / 255,
        g: parseInt(rgbMatch[2]) / 255,
        b: parseInt(rgbMatch[3]) / 255,
      };
    }

    return null;
  }

  /**
   * Export with full options. If transparent is true, background is stripped before export.
   */
  exportImage(options: ExportOptions, fileName: string): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    if (options.format === 'svg') {
      this.exportSVG(fileName);
      return;
    }

    const multiplier = options.width / this.canvasService.canvasWidth();

    const dataUrl = this.withIdentityViewport(() => {
      // Strip background if transparent requested
      let originalBg: any;
      if (options.transparent) {
        originalBg = canvas.backgroundColor;
        canvas.backgroundColor = undefined as any;
        canvas.renderAll();
      }

      const url = canvas.toDataURL({
        format: options.format as 'png' | 'jpeg' | 'webp',
        quality: options.quality,
        multiplier,
      });

      // Restore background
      if (options.transparent && originalBg !== undefined) {
        canvas.backgroundColor = originalBg;
        canvas.renderAll();
      }

      return url;
    });

    const blob = this.dataURLToBlob(dataUrl);
    saveAs(blob, `${fileName}.${options.format}`);
  }

  exportSVG(fileName: string): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const svg = this.withIdentityViewport(() => canvas.toSVG());
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `${fileName}.svg`);
    return;
  }

  /**
   * Export transparent PNG at given width/height. Background is always removed.
   */
  exportTransparentPNG(fileName: string, width: number, height: number): void {
    this.exportImage(
      { format: 'png', quality: 1, width, height, transparent: true },
      fileName,
    );
  }

  /**
   * Export with background kept intact.
   */
  exportWithBackground(format: 'png' | 'jpeg' | 'webp', fileName: string, width: number, height: number, quality = 1): void {
    this.exportImage(
      { format, quality, width, height, transparent: false },
      fileName,
    );
  }

  private dataURLToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const byteString = atob(parts[1]);
    const uint8Array = new Uint8Array(byteString.length);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mime });
  }
}
