import { TestBed } from '@angular/core/testing';
import { AiDesignService } from './ai-design.service';
import { CanvasService } from './canvas.service';
import { AiBackgroundService } from './ai-background.service';

describe('AiDesignService', () => {
  let service: AiDesignService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiDesignService,
        { provide: CanvasService, useValue: { getCanvas: () => null, canvasWidth: () => 1000, canvasHeight: () => 1000 } },
        { provide: AiBackgroundService, useValue: { generateAndApply: () => {} } },
      ],
    });
    service = TestBed.inject(AiDesignService);
  });

  describe('parsePrompt', () => {
    it('detects "post" type from prompt', () => {
      const intent = service.parsePrompt('Instagram post for coffee shop');
      expect(intent.type).toBe('post');
    });

    it('detects "banner" type', () => {
      const intent = service.parsePrompt('A banner for my website');
      expect(intent.type).toBe('banner');
    });

    it('detects "story" type', () => {
      const intent = service.parsePrompt('Instagram story about new product');
      expect(intent.type).toBe('story');
    });

    it('detects minimalist vibe from keyword', () => {
      const intent = service.parsePrompt('Clean minimal logo for a startup');
      expect(intent.vibe).toBe('minimalist');
    });

    it('detects playful vibe', () => {
      const intent = service.parsePrompt('Fun colorful party invite');
      expect(intent.vibe).toBe('playful');
    });

    it('detects luxury vibe', () => {
      const intent = service.parsePrompt('Premium elegant menu design');
      expect(intent.vibe).toBe('luxury');
    });

    it('defaults to vibrant vibe', () => {
      const intent = service.parsePrompt('A post for something');
      expect(intent.vibe).toBe('vibrant');
    });

    it('generates sensible headline for sale prompts', () => {
      const intent = service.parsePrompt('Post for coffee shop sale');
      expect(intent.headline).toContain('Sale');
    });

    it('picks a valid primary color', () => {
      const intent = service.parsePrompt('Modern tech startup banner');
      expect(intent.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('sets a CTA when appropriate', () => {
      const intent = service.parsePrompt('Ad for sale of new sneakers');
      expect(intent.cta).toBeTruthy();
    });
  });
});
