import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CanvasService } from './canvas.service';
import { ApiService } from './api.service';
import type { PlatformType } from '../constants/platform-presets';
import type { Template } from '../models/template.model';
import * as fabric from 'fabric';

export interface LogoTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
}

export const LOGO_TEMPLATES: LogoTemplate[] = [
  // Logos
  { id: 'monogram', name: 'Monogram', category: 'Logo', icon: 'text_fields', description: 'Bold initial letters' },
  { id: 'wordmark', name: 'Wordmark', category: 'Logo', icon: 'title', description: 'Styled company name' },
  { id: 'icon-text', name: 'Icon + Text', category: 'Logo', icon: 'dashboard', description: 'Symbol with company name' },
  { id: 'badge', name: 'Badge', category: 'Logo', icon: 'verified', description: 'Circular badge style' },
  { id: 'minimal', name: 'Minimal', category: 'Logo', icon: 'crop_square', description: 'Clean geometric mark' },
  { id: 'stacked', name: 'Stacked', category: 'Logo', icon: 'view_agenda', description: 'Icon over text layout' },
  // Social Media
  { id: 'insta-post', name: 'Instagram Post', category: 'Social', icon: 'photo_camera', description: '1080×1080 social post' },
  { id: 'fb-cover', name: 'Facebook Cover', category: 'Social', icon: 'facebook', description: '820×312 cover photo' },
  { id: 'yt-thumb', name: 'YouTube Thumb', category: 'Social', icon: 'smart_display', description: '1280×720 video thumbnail' },
  // Marketing
  { id: 'business-card', name: 'Business Card', category: 'Marketing', icon: 'contact_mail', description: '1050×600 card design' },
  { id: 'poster', name: 'Event Poster', category: 'Marketing', icon: 'campaign', description: '800×1200 poster layout' },
  { id: 'sale-banner', name: 'Sale Banner', category: 'Marketing', icon: 'sell', description: '1200×628 promo banner' },
];

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly canvasService = inject(CanvasService);
  private readonly apiService = inject(ApiService);

  readonly templates = LOGO_TEMPLATES;

  /**
   * Fetch a seed starter {@link Template} by its `_id`.
   *
   * @param id - MongoDB `_id` of the seed template (stringified).
   * @param platform - Platform bucket to scope the backend list query. We
   *   rely on `ApiService.listTemplates(platform)` + a client-side filter
   *   rather than adding a new `GET /api/v1/templates/{id}` endpoint —
   *   PX-060 keeps the backend diff minimal.
   * @returns The matching {@link Template}, or `null` if not found (network
   *   errors surface as `null` via `listTemplates`'s `catchError`).
   *
   * @remarks
   * Added for PX-060 T-3 (Brand-Kit Undo). The BrandKitApplyService needs
   * the template's `palette_slots` to restore role-default colors on the
   * canvas after the user clicks "Undo".
   *
   * @example
   * ```ts
   * const tpl = await templateService.getById('tpl-abc', 'ig-post');
   * if (tpl) console.log(tpl.palette_slots);
   * ```
   *
   * @see Story PX-060
   */
  async getById(id: string, platform: PlatformType): Promise<Template | null> {
    if (!id || !platform) return null;
    const list = await firstValueFrom(this.apiService.listTemplates(platform));
    return list.find(t => t._id === id) ?? null;
  }

  applyTemplate(templateId: string): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    this.canvasService.clearCanvas();
    this.canvasService.setBackgroundMode('white');

    switch (templateId) {
      case 'monogram':
        this.createMonogram(canvas);
        break;
      case 'wordmark':
        this.createWordmark(canvas);
        break;
      case 'icon-text':
        this.createIconText(canvas);
        break;
      case 'badge':
        this.createBadge(canvas);
        break;
      case 'minimal':
        this.createMinimal(canvas);
        break;
      case 'stacked':
        this.createStacked(canvas);
        break;
      case 'insta-post':
        this.canvasService.setCanvasSize(1080, 1080);
        this.createInstaPost(canvas);
        break;
      case 'fb-cover':
        this.canvasService.setCanvasSize(820, 312);
        this.createFbCover(canvas);
        break;
      case 'yt-thumb':
        this.canvasService.setCanvasSize(1280, 720);
        this.createYtThumb(canvas);
        break;
      case 'business-card':
        this.canvasService.setCanvasSize(1050, 600);
        this.createBusinessCard(canvas);
        break;
      case 'poster':
        this.canvasService.setCanvasSize(800, 1200);
        this.createPoster(canvas);
        break;
      case 'sale-banner':
        this.canvasService.setCanvasSize(1200, 628);
        this.createSaleBanner(canvas);
        break;
    }

    canvas.renderAll();
  }

  private createMonogram(canvas: fabric.Canvas): void {
    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    const bg = new fabric.Rect({
      left: w * 0.15,
      top: h * 0.15,
      width: w * 0.7,
      height: h * 0.7,
      rx: 20,
      ry: 20,
      fill: '#1a1a2e',
    });

    const text = new fabric.IText('PF', {
      left: w * 0.5,
      top: h * 0.5,
      fontSize: Math.min(w, h) * 0.35,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      fill: '#e94560',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(bg, text);
  }

  private createWordmark(canvas: fabric.Canvas): void {
    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    const main = new fabric.IText('BRAND', {
      left: w * 0.5,
      top: h * 0.42,
      fontSize: Math.min(w, h) * 0.2,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      fill: '#2c3e50',
      originX: 'center',
      originY: 'center',
      charSpacing: 300,
    });

    const sub = new fabric.IText('COMPANY', {
      left: w * 0.5,
      top: h * 0.6,
      fontSize: Math.min(w, h) * 0.06,
      fontFamily: 'Helvetica',
      fill: '#7f8c8d',
      originX: 'center',
      originY: 'center',
      charSpacing: 800,
    });

    const line = new fabric.Line(
      [w * 0.3, h * 0.52, w * 0.7, h * 0.52],
      { stroke: '#e74c3c', strokeWidth: 3 },
    );

    canvas.add(main, line, sub);
  }

  private createIconText(canvas: fabric.Canvas): void {
    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    const icon = new fabric.Circle({
      left: w * 0.25,
      top: h * 0.5,
      radius: Math.min(w, h) * 0.15,
      fill: '#3498db',
      originX: 'center',
      originY: 'center',
    });

    const innerTriangle = new fabric.Triangle({
      left: w * 0.25,
      top: h * 0.48,
      width: Math.min(w, h) * 0.14,
      height: Math.min(w, h) * 0.14,
      fill: '#ffffff',
      originX: 'center',
      originY: 'center',
    });

    const name = new fabric.IText('BrandName', {
      left: w * 0.55,
      top: h * 0.45,
      fontSize: Math.min(w, h) * 0.1,
      fontFamily: 'Roboto',
      fontWeight: 'bold',
      fill: '#2c3e50',
      originX: 'left',
      originY: 'center',
    });

    const tagline = new fabric.IText('Your Tagline Here', {
      left: w * 0.55,
      top: h * 0.58,
      fontSize: Math.min(w, h) * 0.035,
      fontFamily: 'Roboto',
      fill: '#95a5a6',
      originX: 'left',
      originY: 'center',
    });

    canvas.add(icon, innerTriangle, name, tagline);
  }

  private createBadge(canvas: fabric.Canvas): void {
    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();
    const r = Math.min(w, h) * 0.35;

    const outerCircle = new fabric.Circle({
      left: w * 0.5,
      top: h * 0.5,
      radius: r,
      fill: '#1a1a2e',
      originX: 'center',
      originY: 'center',
    });

    const innerCircle = new fabric.Circle({
      left: w * 0.5,
      top: h * 0.5,
      radius: r * 0.85,
      fill: '',
      stroke: '#e94560',
      strokeWidth: 3,
      originX: 'center',
      originY: 'center',
    });

    const brandText = new fabric.IText('BRAND', {
      left: w * 0.5,
      top: h * 0.45,
      fontSize: r * 0.45,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      fill: '#ffffff',
      originX: 'center',
      originY: 'center',
      charSpacing: 200,
    });

    const estText = new fabric.IText('EST. 2025', {
      left: w * 0.5,
      top: h * 0.6,
      fontSize: r * 0.14,
      fontFamily: 'Georgia',
      fill: '#e94560',
      originX: 'center',
      originY: 'center',
      charSpacing: 400,
    });

    canvas.add(outerCircle, innerCircle, brandText, estText);
  }

  private createMinimal(canvas: fabric.Canvas): void {
    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();
    const size = Math.min(w, h) * 0.2;

    const square = new fabric.Rect({
      left: w * 0.5,
      top: h * 0.4,
      width: size,
      height: size,
      fill: '#2c3e50',
      angle: 45,
      originX: 'center',
      originY: 'center',
    });

    const dot = new fabric.Circle({
      left: w * 0.5,
      top: h * 0.4,
      radius: size * 0.15,
      fill: '#e74c3c',
      originX: 'center',
      originY: 'center',
    });

    const text = new fabric.IText('brand', {
      left: w * 0.5,
      top: h * 0.65,
      fontSize: Math.min(w, h) * 0.07,
      fontFamily: 'Helvetica',
      fill: '#2c3e50',
      originX: 'center',
      originY: 'center',
      charSpacing: 500,
    });

    canvas.add(square, dot, text);
  }

  private createStacked(canvas: fabric.Canvas): void {
    const w = this.canvasService.canvasWidth();
    const h = this.canvasService.canvasHeight();

    // Stacked triangles icon
    const tri1 = new fabric.Triangle({
      left: w * 0.5,
      top: h * 0.25,
      width: Math.min(w, h) * 0.25,
      height: Math.min(w, h) * 0.22,
      fill: '#0ea5e9',
      originX: 'center',
      originY: 'center',
    });

    const tri2 = new fabric.Triangle({
      left: w * 0.5,
      top: h * 0.38,
      width: Math.min(w, h) * 0.18,
      height: Math.min(w, h) * 0.16,
      fill: '#7c3aed',
      originX: 'center',
      originY: 'center',
      angle: 180,
    });

    const brandName = new fabric.IText('BRAND', {
      left: w * 0.5,
      top: h * 0.58,
      fontSize: Math.min(w, h) * 0.12,
      fontFamily: 'Roboto',
      fontWeight: 'bold',
      fill: '#1e293b',
      originX: 'center',
      originY: 'center',
      charSpacing: 400,
    });

    const tagline = new fabric.IText('Design Studio', {
      left: w * 0.5,
      top: h * 0.7,
      fontSize: Math.min(w, h) * 0.04,
      fontFamily: 'Roboto',
      fill: '#94a3b8',
      originX: 'center',
      originY: 'center',
      charSpacing: 300,
    });

    canvas.add(tri1, tri2, brandName, tagline);
  }

  // --- Social Media Templates ---

  private createInstaPost(canvas: fabric.Canvas): void {
    const bg = new fabric.Rect({ left: 0, top: 0, width: 1080, height: 1080, fill: '#667eea' });
    const circle = new fabric.Circle({ left: 540, top: 380, radius: 180, fill: '#764ba2', originX: 'center', originY: 'center' });
    const heading = new fabric.IText('YOUR\nMESSAGE', { left: 540, top: 380, fontSize: 72, fontFamily: 'Helvetica', fontWeight: 'bold', fill: '#ffffff', originX: 'center', originY: 'center', textAlign: 'center', lineHeight: 1.1 });
    const tag = new fabric.IText('#hashtag  #trending  #design', { left: 540, top: 920, fontSize: 24, fontFamily: 'Roboto', fill: 'rgba(255,255,255,0.7)', originX: 'center', originY: 'center' });
    const handle = new fabric.IText('@yourbrand', { left: 540, top: 980, fontSize: 28, fontFamily: 'Roboto', fontWeight: 'bold', fill: '#ffffff', originX: 'center', originY: 'center' });
    canvas.add(bg, circle, heading, tag, handle);
  }

  private createFbCover(canvas: fabric.Canvas): void {
    const bg = new fabric.Rect({ left: 0, top: 0, width: 820, height: 312, fill: '#1a1a2e' });
    const accent = new fabric.Rect({ left: 0, top: 0, width: 8, height: 312, fill: '#e94560' });
    const title = new fabric.IText('Company Name', { left: 60, top: 120, fontSize: 48, fontFamily: 'Helvetica', fontWeight: 'bold', fill: '#ffffff' });
    const sub = new fabric.IText('Your tagline goes here — something memorable.', { left: 60, top: 190, fontSize: 18, fontFamily: 'Roboto', fill: 'rgba(255,255,255,0.6)' });
    canvas.add(bg, accent, title, sub);
  }

  private createYtThumb(canvas: fabric.Canvas): void {
    const bg = new fabric.Rect({ left: 0, top: 0, width: 1280, height: 720, fill: '#0f0c29' });
    const shape = new fabric.Triangle({ left: 1100, top: 360, width: 500, height: 600, fill: '#e94560', originX: 'center', originY: 'center', opacity: 0.4 });
    const title = new fabric.IText('VIDEO\nTITLE', { left: 80, top: 280, fontSize: 96, fontFamily: 'Helvetica', fontWeight: 'bold', fill: '#ffffff', lineHeight: 1.0 });
    const badge = new fabric.Rect({ left: 80, top: 520, width: 160, height: 48, rx: 24, ry: 24, fill: '#e94560' });
    const badgeText = new fabric.IText('NEW', { left: 160, top: 544, fontSize: 22, fontFamily: 'Roboto', fontWeight: 'bold', fill: '#ffffff', originX: 'center', originY: 'center' });
    canvas.add(bg, shape, title, badge, badgeText);
  }

  // --- Marketing Templates ---

  private createBusinessCard(canvas: fabric.Canvas): void {
    const bg = new fabric.Rect({ left: 0, top: 0, width: 1050, height: 600, fill: '#ffffff' });
    const sidebar = new fabric.Rect({ left: 0, top: 0, width: 360, height: 600, fill: '#1e293b' });
    const initials = new fabric.IText('JD', { left: 180, top: 200, fontSize: 72, fontFamily: 'Georgia', fontWeight: 'bold', fill: '#ffffff', originX: 'center', originY: 'center' });
    const line = new fabric.Line([180, 260, 180, 260], { stroke: '#3b82f6', strokeWidth: 40 });
    const name = new fabric.IText('John Doe', { left: 420, top: 200, fontSize: 36, fontFamily: 'Helvetica', fontWeight: 'bold', fill: '#1e293b' });
    const role = new fabric.IText('Creative Director', { left: 420, top: 250, fontSize: 18, fontFamily: 'Roboto', fill: '#64748b' });
    const phone = new fabric.IText('+1 (555) 000-0000', { left: 420, top: 360, fontSize: 16, fontFamily: 'Roboto', fill: '#475569' });
    const email = new fabric.IText('john@company.com', { left: 420, top: 390, fontSize: 16, fontFamily: 'Roboto', fill: '#475569' });
    const website = new fabric.IText('www.company.com', { left: 420, top: 420, fontSize: 16, fontFamily: 'Roboto', fill: '#3b82f6' });
    canvas.add(bg, sidebar, initials, line, name, role, phone, email, website);
  }

  private createPoster(canvas: fabric.Canvas): void {
    const bg = new fabric.Rect({ left: 0, top: 0, width: 800, height: 1200, fill: '#0f172a' });
    const accent = new fabric.Circle({ left: 400, top: 300, radius: 200, fill: '#7c3aed', opacity: 0.4, originX: 'center', originY: 'center' });
    const accent2 = new fabric.Circle({ left: 600, top: 500, radius: 150, fill: '#06b6d4', opacity: 0.3, originX: 'center', originY: 'center' });
    const eventLabel = new fabric.IText('EVENT', { left: 60, top: 200, fontSize: 18, fontFamily: 'Roboto', fill: '#7c3aed', charSpacing: 600 });
    const title = new fabric.IText('Annual\nDesign\nConference', { left: 60, top: 260, fontSize: 72, fontFamily: 'Helvetica', fontWeight: 'bold', fill: '#ffffff', lineHeight: 1.1 });
    const date = new fabric.IText('March 15, 2026  |  City Center', { left: 60, top: 600, fontSize: 20, fontFamily: 'Roboto', fill: 'rgba(255,255,255,0.6)' });
    const cta = new fabric.Rect({ left: 60, top: 1050, width: 240, height: 56, rx: 28, ry: 28, fill: '#7c3aed' });
    const ctaText = new fabric.IText('Get Tickets', { left: 180, top: 1078, fontSize: 20, fontFamily: 'Roboto', fontWeight: 'bold', fill: '#ffffff', originX: 'center', originY: 'center' });
    canvas.add(bg, accent, accent2, eventLabel, title, date, cta, ctaText);
  }

  private createSaleBanner(canvas: fabric.Canvas): void {
    const bg = new fabric.Rect({ left: 0, top: 0, width: 1200, height: 628, fill: '#fef2f2' });
    const shape = new fabric.Circle({ left: 900, top: 314, radius: 250, fill: '#ef4444', opacity: 0.15, originX: 'center', originY: 'center' });
    const bigSale = new fabric.IText('BIG SALE', { left: 80, top: 160, fontSize: 86, fontFamily: 'Helvetica', fontWeight: 'bold', fill: '#ef4444', charSpacing: 100 });
    const discount = new fabric.IText('UP TO 50% OFF', { left: 80, top: 280, fontSize: 36, fontFamily: 'Roboto', fill: '#1e293b' });
    const details = new fabric.IText('Limited time offer. Shop now at brand.com', { left: 80, top: 380, fontSize: 20, fontFamily: 'Roboto', fill: '#64748b' });
    const btn = new fabric.Rect({ left: 80, top: 440, width: 200, height: 52, rx: 8, ry: 8, fill: '#ef4444' });
    const btnText = new fabric.IText('SHOP NOW', { left: 180, top: 466, fontSize: 18, fontFamily: 'Roboto', fontWeight: 'bold', fill: '#ffffff', originX: 'center', originY: 'center', charSpacing: 200 });
    canvas.add(bg, shape, bigSale, discount, details, btn, btnText);
  }
}
