import { Injectable, inject, signal, effect } from '@angular/core';
import DOMPurify from 'dompurify';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/**
 * A logo stored in the user's Brand Kit.
 *
 * @remarks
 * `dataUrl` is always a `data:` URL. For SVG logos, the underlying SVG
 * source has already passed through {@link sanitizeSvg} before being
 * base64-encoded — callers can safely render or download it.
 *
 * `mimeType` is set when known (set by {@link BrandKitService.addBrandLogo});
 * older persisted records without a mimeType are treated as raster.
 *
 * @see PX-003
 */
export interface BrandLogo {
  id: string;
  name: string;
  dataUrl: string;
  /** Original MIME type — present on v2+ records (PX-003). */
  mimeType?: string;
}

/** Regex isolating the base64 payload of a `data:image/svg+xml;base64,…` URL. */
const SVG_DATA_URL_RE = /^data:image\/svg\+xml(?:;[^,]*)?,/i;

/**
 * Sanitize an SVG source string via DOMPurify, stripping script / foreignObject /
 * event-handler attributes so stored brand logos cannot smuggle XSS payloads.
 *
 * @param svg - Raw SVG source (UTF-8 XML).
 * @returns A sanitized SVG string safe to render or persist.
 *
 * @remarks
 * Profile: `USE_PROFILES: { svg: true, svgFilters: true }`.
 * Explicit forbids: `<script>`, `<foreignObject>`, `onload` / `onerror` / `onclick` attrs.
 * This is the first of two layers — the backend re-parses with `defusedxml`
 * as defense-in-depth (see ARD §14, PX-003 AC-7).
 *
 * @example
 * ```ts
 * const clean = sanitizeSvg('<svg onload="alert(1)"><script/></svg>');
 * // -> '<svg></svg>'
 * ```
 *
 * @see PX-003
 */
export function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick'],
  }) as unknown as string;
}

/**
 * Detect whether a data URL carries SVG content.
 *
 * @param dataUrl - A `data:` URL string (or anything else — non-matching
 *   inputs return `false`).
 * @returns `true` if the URL is `data:image/svg+xml[;…],…`, otherwise `false`.
 */
export function isSvgDataUrl(dataUrl: string): boolean {
  return SVG_DATA_URL_RE.test(dataUrl);
}

/**
 * Decode a `data:image/svg+xml[;base64],…` URL to its raw SVG text.
 *
 * @param dataUrl - A data URL known to match {@link isSvgDataUrl}.
 * @returns The decoded SVG string, or the empty string if decoding fails.
 */
export function decodeSvgDataUrl(dataUrl: string): string {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) return '';
  const meta = dataUrl.slice(0, commaIdx).toLowerCase();
  const payload = dataUrl.slice(commaIdx + 1);
  try {
    if (meta.includes(';base64')) {
      return atob(payload);
    }
    return decodeURIComponent(payload);
  } catch {
    return '';
  }
}

/**
 * Encode a raw SVG string back into a `data:image/svg+xml;base64,…` URL.
 *
 * @param svg - The SVG source to encode.
 * @returns A base64 data URL suitable for `<img src>` and `<a download>`.
 */
export function encodeSvgToDataUrl(svg: string): string {
  // WHY: btoa requires Latin-1; SVGs may contain unicode glyph hints, so go
  // through the encodeURIComponent + unescape trick (well-known safe pattern).
  const b64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
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

  /**
   * Add a brand logo. SVG data URLs are sanitized via {@link sanitizeSvg}
   * before being stored; raster images pass through untouched.
   *
   * @param name - Human-readable logo name (e.g. the uploaded filename).
   * @param dataUrl - `data:` URL containing the logo bytes.
   * @returns The freshly created {@link BrandLogo}, including its UUID.
   *
   * @remarks
   * For SVG inputs, the stored `dataUrl` is **not** byte-identical to the
   * user-supplied URL — it is the re-encoded output of `DOMPurify.sanitize`.
   * This is the ONLY sanitation step on the frontend; the backend re-parses
   * with `defusedxml` as defense-in-depth (see {@link sanitizeSvg}).
   *
   * `mimeType` is populated so the UI layer can feature-gate "Download SVG"
   * against only SVG logos (PX-003 AC-3).
   *
   * @see PX-003
   */
  addBrandLogo(name: string, dataUrl: string): BrandLogo {
    let finalUrl = dataUrl;
    let mimeType: string | undefined;
    if (isSvgDataUrl(dataUrl)) {
      const raw = decodeSvgDataUrl(dataUrl);
      const clean = sanitizeSvg(raw);
      finalUrl = encodeSvgToDataUrl(clean);
      mimeType = 'image/svg+xml';
    } else if (dataUrl.startsWith('data:')) {
      const end = dataUrl.indexOf(';');
      const semi = end === -1 ? dataUrl.indexOf(',') : end;
      mimeType = semi > 5 ? dataUrl.slice(5, semi) : undefined;
    }
    const logo: BrandLogo = { id: crypto.randomUUID(), name, dataUrl: finalUrl, mimeType };
    this._brandLogos.update(l => [logo, ...l]);
    this.persist(BRAND_LOGOS_KEY, this._brandLogos());
    this.scheduleSync();
    return logo;
  }

  /**
   * Trigger a browser download of an SVG brand logo in its native form.
   *
   * @param logo - The logo to download. MUST have `mimeType === 'image/svg+xml'`;
   *   non-SVG logos are a no-op (callers should feature-gate the UI trigger).
   *
   * @remarks
   * Uses the Blob + `URL.createObjectURL` + hidden `<a download>` pattern
   * so the browser names the file `${logo.name}.svg`. Revokes the object URL
   * on the next tick to avoid leaking memory.
   *
   * @see PX-003 AC-3
   */
  downloadBrandLogoSvg(logo: BrandLogo): void {
    if (logo.mimeType !== 'image/svg+xml') return;
    const svg = isSvgDataUrl(logo.dataUrl) ? decodeSvgDataUrl(logo.dataUrl) : logo.dataUrl;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = logo.name.toLowerCase().endsWith('.svg') ? logo.name : `${logo.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // WHY: give the browser a tick to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 0);
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
