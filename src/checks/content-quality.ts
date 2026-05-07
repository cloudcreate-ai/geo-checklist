import type { CheckDefinition } from '../types';
import { extractVisibleText, countWords } from '../utils/text-extract';
import { MIN_WORD_COUNT } from '../config';

const CATEGORY = 'Content Quality';

export const contentQualityChecks: CheckDefinition[] = [
  {
    id: '3.1',
    title: 'Minimum 300 words of unique content',
    severity: 'warning',
    execute: (ctx) => {
      const text = extractVisibleText(ctx.html);
      const wordCount = countWords(text);
      if (wordCount < MIN_WORD_COUNT) {
        return { id: '3.1', category: CATEGORY, title: 'Minimum 300 words of unique content', severity: 'warning', passed: false, value: wordCount, details: `Page has ${wordCount} words (minimum ${MIN_WORD_COUNT}).`, recommendation: 'Add more unique content to avoid thin content penalties.' };
      }
      return { id: '3.1', category: CATEGORY, title: 'Minimum 300 words of unique content', severity: 'warning', passed: true, value: wordCount, details: `Page has ${wordCount} words.` };
    },
  },
  {
    id: '3.2',
    title: 'Content answers user intent for target query',
    severity: 'critical',
    execute: () => ({ id: '3.2', category: CATEGORY, title: 'Content answers user intent for target query', severity: 'critical', passed: false, details: 'Check requires NLP/semantic analysis. Deferred to Phase 2.' }),
  },
  {
    id: '3.3',
    title: 'No duplicate content across pages',
    severity: 'critical',
    execute: () => ({ id: '3.3', category: CATEGORY, title: 'No duplicate content across pages', severity: 'critical', passed: false, details: 'Check requires multi-page crawling and comparison. Deferred to Phase 2.' }),
  },
  {
    id: '3.4',
    title: 'Content is up-to-date (freshness signal)',
    severity: 'info',
    execute: () => ({ id: '3.4', category: CATEGORY, title: 'Content is up-to-date (freshness signal)', severity: 'info', passed: false, details: 'Requires browser rendering check.' }),
  },
  {
    id: '3.5',
    title: 'Language attribute set on html element',
    severity: 'warning',
    execute: (ctx) => {
      const lang = ctx.doc('html').attr('lang');
      if (!lang) {
        return { id: '3.5', category: CATEGORY, title: 'Language attribute set on html element', severity: 'warning', passed: false, details: 'No lang attribute on <html> tag.', recommendation: 'Add a lang attribute (e.g., lang="en") to the <html> element.' };
      }
      return { id: '3.5', category: CATEGORY, title: 'Language attribute set on html element', severity: 'warning', passed: true, value: lang, details: `Language: ${lang}.` };
    },
  },
];
