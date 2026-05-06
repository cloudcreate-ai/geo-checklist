import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export function stripScriptsAndStyles(doc: CheerioAPI): void {
  doc('script, style, noscript').remove();
}

export function extractVisibleText(html: string): string {
  const doc = load(html);
  doc('script, style, noscript, meta, link').remove();
  const text = doc.text();
  return text.replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  const words = text.match(/\b\w+\b/g);
  return words ? words.length : 0;
}
