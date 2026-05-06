import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export function parseHtml(html: string): CheerioAPI {
  return load(html);
}
