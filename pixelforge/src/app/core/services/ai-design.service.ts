import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import { AiBackgroundService } from './ai-background.service';
import * as fabric from 'fabric';

interface DesignIntent {
  topic: string;             // e.g. "coffee shop"
  type: string;              // post, banner, flyer, story, ad, logo
  cta?: string;              // e.g. "Order Now"
  headline?: string;
  subheadline?: string;
  vibe: 'vibrant' | 'minimalist' | 'professional' | 'playful' | 'luxury';
  primaryColor: string;
  textColor: string;
}

interface VibePalette {
  primary: string[];
  textOnPrimary: string;
  accent: string[];
  fonts: { heading: string; body: string };
}

const VIBE_PALETTES: Record<DesignIntent['vibe'], VibePalette> = {
  vibrant: {
    primary: ['#7c3aed', '#06b6d4', '#ef4444', '#f59e0b', '#10b981'],
    textOnPrimary: '#ffffff',
    accent: ['#fbbf24', '#f472b6'],
    fonts: { heading: 'Poppins', body: 'Inter' },
  },
  minimalist: {
    primary: ['#0f172a', '#1e293b', '#f8fafc', '#e2e8f0'],
    textOnPrimary: '#0f172a',
    accent: ['#3b82f6'],
    fonts: { heading: 'DM Sans', body: 'DM Sans' },
  },
  professional: {
    primary: ['#1e40af', '#0c4a6e', '#0f766e', '#1f2937'],
    textOnPrimary: '#ffffff',
    accent: ['#fbbf24'],
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  playful: {
    primary: ['#ec4899', '#a855f7', '#06b6d4', '#10b981', '#f59e0b'],
    textOnPrimary: '#ffffff',
    accent: ['#fbbf24', '#f472b6'],
    fonts: { heading: 'Bungee', body: 'Poppins' },
  },
  luxury: {
    primary: ['#0f0c29', '#1a1a2e', '#2c1810'],
    textOnPrimary: '#fbbf24',
    accent: ['#fbbf24', '#d4af37'],
    fonts: { heading: 'Playfair Display', body: 'Cormorant Garamond' },
  },
};

@Injectable({ providedIn: 'root' })
export class AiDesignService {
  private readonly canvasService = inject(CanvasService);
  private readonly aiBgService = inject(AiBackgroundService);

  /**
   * Parse a user prompt into a structured design intent.
   */
  parsePrompt(prompt: string): DesignIntent {
    const p = prompt.toLowerCase();

    // Detect type
    let type = 'post';
    if (/\b(banner|cover|header)\b/.test(p)) type = 'banner';
    else if (/\b(flyer|poster)\b/.test(p)) type = 'flyer';
    else if (/\bstory\b/.test(p)) type = 'story';
    else if (/\b(ad|advert|promotion)\b/.test(p)) type = 'ad';
    else if (/\blogo\b/.test(p)) type = 'logo';
    else if (/\bpost\b/.test(p)) type = 'post';

    // Detect vibe
    let vibe: DesignIntent['vibe'] = 'vibrant';
    if (/\b(minimal|clean|simple|modern)\b/.test(p)) vibe = 'minimalist';
    else if (/\b(professional|corporate|business|formal)\b/.test(p)) vibe = 'professional';
    else if (/\b(playful|fun|colorful|kids|party)\b/.test(p)) vibe = 'playful';
    else if (/\b(luxury|premium|elegant|gold|sophisticated)\b/.test(p)) vibe = 'luxury';

    // Extract topic — try to find "for X" or "about X"
    let topic = '';
    const forMatch = p.match(/(?:for|about|of)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\s'-]+?)(?:\s+(?:sale|promotion|launch|event|special|with|in|on|today|now|soon)|[.,!?]|$)/);
    if (forMatch) topic = forMatch[1].trim();
    else {
      // Fallback: use everything after the type keyword
      const typeMatch = p.match(new RegExp(`${type}\\s+(?:for\\s+)?(.+)$`));
      if (typeMatch) topic = typeMatch[1].trim();
      else topic = prompt.trim();
    }
    topic = topic.replace(/^(a|an|the)\s+/, '').trim();

    // Detect specific CTA hints
    let cta = '';
    if (/\bsale\b/.test(p)) cta = 'Shop Now';
    else if (/\b(launch|new)\b/.test(p)) cta = 'Discover';
    else if (/\bevent\b/.test(p)) cta = 'Get Tickets';
    else if (/\bsign\s*up\b/.test(p)) cta = 'Sign Up';
    else if (/\b(order|buy)\b/.test(p)) cta = 'Order Now';
    else if (/\b(book|reserve)\b/.test(p)) cta = 'Book Now';
    else if (/\b(learn|read)\b/.test(p)) cta = 'Learn More';

    // Generate headline
    const headline = this.generateHeadline(topic, p);
    const subheadline = this.generateSubheadline(topic, type, vibe);

    // Pick palette
    const palette = VIBE_PALETTES[vibe];
    const primaryColor = palette.primary[Math.floor(Math.random() * palette.primary.length)];

    return {
      topic,
      type,
      cta: cta || undefined,
      headline,
      subheadline,
      vibe,
      primaryColor,
      textColor: palette.textOnPrimary,
    };
  }

  private generateHeadline(topic: string, prompt: string): string {
    const titled = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (/\bsale\b/.test(prompt)) return `${titled} Sale`;
    if (/\b(launch|new)\b/.test(prompt)) return `Introducing ${titled}`;
    if (/\bevent\b/.test(prompt)) return `${titled} Event`;
    if (/\b(workshop|class)\b/.test(prompt)) return `${titled} Workshop`;
    if (/\bspecial\b/.test(prompt)) return `${titled} Special`;
    return titled;
  }

  private generateSubheadline(topic: string, type: string, vibe: DesignIntent['vibe']): string {
    const subs: Record<string, string[]> = {
      vibrant: ['Limited time offer', 'Don\'t miss out', 'New arrivals daily', 'Join the experience'],
      minimalist: ['Refined. Curated. Yours.', 'Less, but better.', 'Crafted with care.'],
      professional: ['Trusted by industry leaders', 'Solutions that scale', 'Built for professionals'],
      playful: ['Let\'s have some fun!', 'Pure joy inside', 'Smiles guaranteed'],
      luxury: ['An invitation to indulge', 'Crafted to perfection', 'Exclusively yours'],
    };
    const list = subs[vibe];
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Generate a complete design from a text prompt.
   */
  async generate(prompt: string): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const intent = this.parsePrompt(prompt);
    const palette = VIBE_PALETTES[intent.vibe];

    // Adjust canvas size based on type
    const sizes: Record<string, [number, number]> = {
      post: [1080, 1080],
      banner: [1500, 500],
      flyer: [800, 1200],
      story: [1080, 1920],
      ad: [1200, 628],
      logo: [1000, 1000],
    };
    const [w, h] = sizes[intent.type] || [1080, 1080];

    // Clear and resize canvas
    this.canvasService.clearCanvas();
    this.canvasService.setCanvasSize(w, h);

    // 1. Background — use AI background generator with the vibe
    const bgPrompt = intent.vibe === 'vibrant' ? 'mesh sunset'
      : intent.vibe === 'minimalist' ? 'pastel gradient'
      : intent.vibe === 'professional' ? 'midnight space'
      : intent.vibe === 'playful' ? 'tropical waves'
      : 'gold luxury';
    this.aiBgService.generateAndApply(bgPrompt);

    // Wait briefly for background to apply
    await new Promise(resolve => setTimeout(resolve, 200));

    // 2. Headline text — large, bold, top center
    const headlineSize = intent.type === 'banner' ? Math.min(w, h) * 0.16 : Math.min(w, h) * 0.1;
    const headline = new fabric.IText(intent.headline || 'Your Headline', {
      left: w / 2,
      top: h * (intent.type === 'banner' ? 0.4 : 0.32),
      originX: 'center',
      originY: 'center',
      fontSize: headlineSize,
      fontFamily: palette.fonts.heading,
      fontWeight: 'bold',
      fill: palette.textOnPrimary,
      textAlign: 'center',
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 12, offsetX: 0, offsetY: 4 }),
    });
    canvas.add(headline);

    // 3. Subheadline
    if (intent.subheadline) {
      const subSize = headlineSize * 0.32;
      const sub = new fabric.IText(intent.subheadline, {
        left: w / 2,
        top: h * (intent.type === 'banner' ? 0.65 : 0.5),
        originX: 'center',
        originY: 'center',
        fontSize: subSize,
        fontFamily: palette.fonts.body,
        fill: palette.textOnPrimary,
        opacity: 0.85,
        textAlign: 'center',
      });
      canvas.add(sub);
    }

    // 4. CTA button (if not a logo)
    if (intent.cta && intent.type !== 'logo') {
      const btnW = Math.min(w, h) * 0.32;
      const btnH = Math.min(w, h) * 0.08;
      const btnY = intent.type === 'banner' ? h * 0.85 : h * 0.72;
      const btnRadius = btnH / 2;

      const accent = palette.accent[0];
      const btn = new fabric.Rect({
        left: w / 2,
        top: btnY,
        width: btnW,
        height: btnH,
        rx: btnRadius,
        ry: btnRadius,
        fill: accent,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(btn);

      const btnText = new fabric.IText(intent.cta, {
        left: w / 2,
        top: btnY,
        originX: 'center',
        originY: 'center',
        fontSize: btnH * 0.42,
        fontFamily: palette.fonts.body,
        fontWeight: 'bold',
        fill: '#0f172a',
        textAlign: 'center',
      });
      canvas.add(btnText);
    }

    // 5. Decorative element — circle accent in corner
    if (intent.type !== 'logo') {
      const accent = palette.accent[Math.floor(Math.random() * palette.accent.length)];
      const decor = new fabric.Circle({
        left: w * 0.92,
        top: h * 0.08,
        radius: Math.min(w, h) * 0.06,
        fill: accent,
        opacity: 0.6,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(decor);
    }

    canvas.renderAll();
  }
}
