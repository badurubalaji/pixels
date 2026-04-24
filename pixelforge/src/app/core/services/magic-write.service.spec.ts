import { TestBed } from '@angular/core/testing';
import { MagicWriteService } from './magic-write.service';

describe('MagicWriteService', () => {
  let service: MagicWriteService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MagicWriteService] });
    service = TestBed.inject(MagicWriteService);
  });

  describe('transform', () => {
    it('converts to uppercase', () => {
      expect(service.transform('Hello World', 'uppercase')).toBe('HELLO WORLD');
    });

    it('converts to lowercase', () => {
      expect(service.transform('Hello World', 'lowercase')).toBe('hello world');
    });

    it('applies title case, skipping stop words except first', () => {
      const result = service.transform('the quick brown fox', 'title-case');
      expect(result).toBe('The Quick Brown Fox');
    });

    it('removes filler words', () => {
      const result = service.transform('This is really just very cool', 'remove-fillers');
      expect(result).toBe('This is cool');
    });

    it('converts casual to professional', () => {
      const result = service.transform("I'm gonna do it", 'professional');
      expect(result).toContain('going to');
    });

    it('converts professional to casual (shorter words)', () => {
      const result = service.transform('We need to utilize this solution', 'casual');
      expect(result).toContain('use');
    });

    it('makes text shorter by removing redundant phrases', () => {
      const result = service.transform('in order to make it work', 'shorter');
      expect(result).toContain('to make');
      expect(result).not.toContain('in order to');
    });

    it('generates a headline by trimming and title-casing', () => {
      const result = service.transform('welcome to our amazing product!', 'headline');
      expect(result).not.toContain('!');
      expect(result.charAt(0)).toBe('W');
    });

    it('applies sentence case', () => {
      const result = service.transform('hello world. how are you?', 'sentence-case');
      expect(result).toBe('Hello world. How are you?');
    });

    it('returns unchanged when type is unknown', () => {
      const result = service.transform('Hello', 'none' as any);
      expect(result).toBe('Hello');
    });

    it('handles empty text', () => {
      expect(service.transform('', 'uppercase')).toBe('');
    });
  });

  describe('generateVariants', () => {
    it('returns up to 3 unique variants', () => {
      const variants = service.generateVariants("I'm gonna use this really cool thing");
      expect(variants.length).toBeGreaterThan(0);
      expect(variants.length).toBeLessThanOrEqual(3);
    });

    it('returns empty array for empty text', () => {
      expect(service.generateVariants('')).toEqual([]);
    });
  });
});
