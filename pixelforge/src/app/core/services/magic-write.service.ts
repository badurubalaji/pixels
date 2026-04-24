import { Injectable } from '@angular/core';

export type Transformation =
  | 'shorter'
  | 'longer'
  | 'professional'
  | 'casual'
  | 'headline'
  | 'title-case'
  | 'sentence-case'
  | 'lowercase'
  | 'uppercase'
  | 'remove-fillers';

interface TransformOption {
  type: Transformation;
  label: string;
  icon: string;
}

export const TRANSFORMATIONS: TransformOption[] = [
  { type: 'shorter', label: 'Make Shorter', icon: 'short_text' },
  { type: 'longer', label: 'Make Longer', icon: 'wrap_text' },
  { type: 'professional', label: 'Professional', icon: 'business_center' },
  { type: 'casual', label: 'Casual', icon: 'sentiment_satisfied' },
  { type: 'headline', label: 'Headline Style', icon: 'title' },
  { type: 'title-case', label: 'Title Case', icon: 'text_fields' },
  { type: 'sentence-case', label: 'Sentence case', icon: 'short_text' },
  { type: 'lowercase', label: 'lowercase', icon: 'text_decrease' },
  { type: 'uppercase', label: 'UPPERCASE', icon: 'text_increase' },
  { type: 'remove-fillers', label: 'Remove Fillers', icon: 'filter_alt_off' },
];

const FILLER_WORDS = ['just', 'really', 'very', 'actually', 'basically', 'literally', 'kind of', 'sort of'];

const PROFESSIONAL_SWAPS: Record<string, string> = {
  'gonna': 'going to',
  'wanna': 'want to',
  'kinda': 'kind of',
  'sorta': 'sort of',
  'yeah': 'yes',
  'nope': 'no',
  'gotta': 'have to',
  'ain\'t': 'is not',
  'can\'t': 'cannot',
  'won\'t': 'will not',
  'don\'t': 'do not',
  'doesn\'t': 'does not',
  'isn\'t': 'is not',
  "i'm": 'I am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  'guys': 'team',
  'thing': 'item',
  'stuff': 'items',
  'awesome': 'excellent',
  'cool': 'effective',
  'huge': 'significant',
  'tons of': 'many',
  'lots of': 'numerous',
};

const CASUAL_SWAPS: Record<string, string> = {
  'utilize': 'use',
  'commence': 'start',
  'terminate': 'end',
  'demonstrate': 'show',
  'facilitate': 'help',
  'leverage': 'use',
  'optimal': 'best',
  'subsequently': 'then',
  'in order to': 'to',
  'a number of': 'some',
  'with regard to': 'about',
  'at this point in time': 'now',
};

const STOP_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

@Injectable({ providedIn: 'root' })
export class MagicWriteService {
  transform(text: string, type: Transformation): string {
    if (!text) return text;

    switch (type) {
      case 'shorter':       return this.makeShorter(text);
      case 'longer':        return this.makeLonger(text);
      case 'professional':  return this.applySwaps(text, PROFESSIONAL_SWAPS);
      case 'casual':        return this.applySwaps(text, CASUAL_SWAPS);
      case 'headline':      return this.toHeadline(text);
      case 'title-case':    return this.titleCase(text);
      case 'sentence-case': return this.sentenceCase(text);
      case 'lowercase':     return text.toLowerCase();
      case 'uppercase':     return text.toUpperCase();
      case 'remove-fillers': return this.removeFillers(text);
      default: return text;
    }
  }

  /** Generate up to 3 alternative variants for the given text. */
  generateVariants(text: string): string[] {
    if (!text) return [];
    const variants: string[] = [];

    const shorter = this.makeShorter(text);
    if (shorter !== text) variants.push(shorter);

    const headline = this.toHeadline(text);
    if (headline !== text && !variants.includes(headline)) variants.push(headline);

    const professional = this.applySwaps(text, PROFESSIONAL_SWAPS);
    if (professional !== text && !variants.includes(professional)) variants.push(professional);

    return variants.slice(0, 3);
  }

  // --- internal transformations ---

  private makeShorter(text: string): string {
    let result = this.removeFillers(text);
    result = this.applySwaps(result, CASUAL_SWAPS); // shorter words
    // Remove redundant phrases
    result = result.replace(/\bin order to\b/gi, 'to');
    result = result.replace(/\bat this point in time\b/gi, 'now');
    result = result.replace(/\bdue to the fact that\b/gi, 'because');
    return result.replace(/\s+/g, ' ').trim();
  }

  private makeLonger(text: string): string {
    // Add descriptive prefixes/connectors
    if (text.length > 200) return text;
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    if (sentences.length === 0) return text;

    const enhanced = sentences.map((s, i) => {
      if (i === 0) return s;
      const connectors = ['Additionally,', 'Furthermore,', 'In fact,', 'What\'s more,'];
      return connectors[i % connectors.length] + ' ' + s.charAt(0).toLowerCase() + s.slice(1);
    });

    return enhanced.join(' ');
  }

  private toHeadline(text: string): string {
    let result = text.trim();
    // Remove ending punctuation
    result = result.replace(/[.!?]+$/, '');
    // Title-case
    result = this.titleCase(result);
    // Trim to first sentence if multi-line
    const firstLine = result.split(/[.!?\n]/)[0].trim();
    return firstLine || result;
  }

  private titleCase(text: string): string {
    return text.split(/(\s+)/).map((word, i) => {
      const w = word.toLowerCase();
      // Skip whitespace
      if (!w.trim()) return word;
      // First and last words always capitalize
      if (i === 0 || !STOP_WORDS.has(w)) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }
      return w;
    }).join('');
  }

  private sentenceCase(text: string): string {
    const lower = text.toLowerCase();
    return lower.replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
  }

  private removeFillers(text: string): string {
    let result = text;
    for (const filler of FILLER_WORDS) {
      const re = new RegExp(`\\b${filler}\\b\\s*`, 'gi');
      result = result.replace(re, '');
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  private applySwaps(text: string, swaps: Record<string, string>): string {
    let result = text;
    for (const [from, to] of Object.entries(swaps)) {
      const re = new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(re, (match) => {
        // Preserve capitalization of first letter
        if (match.charAt(0) === match.charAt(0).toUpperCase()) {
          return to.charAt(0).toUpperCase() + to.slice(1);
        }
        return to;
      });
    }
    return result;
  }
}
