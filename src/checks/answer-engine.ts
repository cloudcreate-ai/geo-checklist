import type { CheckDefinition } from '../types';
import { countWords } from '../utils/text-extract';

const CATEGORY = 'Answer Engine Specific';

export const answerEngineChecks: CheckDefinition[] = [
  {
    id: '12.1',
    title: 'Page directly answers specific questions',
    severity: 'warning',
    execute: (ctx) => {
      const headings = ctx.doc('h1, h2, h3, h4, h5, h6');
      let hasQuestionHeading = false;
      headings.each((_, el) => {
        const text = ctx.doc(el).text().trim().toLowerCase();
        if (/^(what|how|why|when|where|who|can|does|is|are|should)/.test(text)) {
          hasQuestionHeading = true;
        }
      });
      if (hasQuestionHeading) {
        return { id: '12.1', category: CATEGORY, title: 'Page directly answers specific questions', severity: 'warning', passed: true, details: 'Question-style headings found.' };
      }
      return { id: '12.1', category: CATEGORY, title: 'Page directly answers specific questions', severity: 'warning', passed: false, details: 'No question-style headings found.', recommendation: 'Use "What is X" or "How to" headings for AI answer matching.' };
    },
  },
  {
    id: '12.2',
    title: 'Key facts in first 100 words',
    severity: 'warning',
    execute: (ctx) => {
      const paragraphs = ctx.doc('body > *:not(script):not(style):not(link):not(meta)');
      let firstText = '';
      paragraphs.each((_, el) => {
        const text = ctx.doc(el).text().trim();
        if (text.length > 10 && firstText.length < 200) {
          firstText += ' ' + text;
        }
      });
      firstText = firstText.trim();
      if (firstText.length < 50) {
        return { id: '12.2', category: CATEGORY, title: 'Key facts in first 100 words', severity: 'warning', passed: false, details: 'Very little content in the page opening.', recommendation: 'Put key facts in the first 100 words for AI snippet extraction.' };
      }
      return { id: '12.2', category: CATEGORY, title: 'Key facts in first 100 words', severity: 'warning', passed: true, details: 'Substantial content in page opening.' };
    },
  },
  {
    id: '12.3',
    title: 'What is / How to content patterns',
    severity: 'info',
    execute: (ctx) => {
      const bodyText = ctx.doc('body').text().trim().toLowerCase();
      const hasWhatIs = /what\s+(is|are|was|were)\s+\w+/.test(bodyText);
      const hasHowTo = /how\s+to\s+\w+/.test(bodyText);
      if (hasWhatIs || hasHowTo) {
        return { id: '12.3', category: CATEGORY, title: 'What is / How to content patterns', severity: 'info', passed: true, details: 'Query-intent matching patterns found.' };
      }
      return { id: '12.3', category: CATEGORY, title: 'What is / How to content patterns', severity: 'info', passed: false, details: 'No "What is" or "How to" patterns detected.', recommendation: 'Include "What is X" or "How to" content for query-intent matching.' };
    },
  },
  {
    id: '12.4',
    title: 'Comparison content (vs, alternative, best)',
    severity: 'info',
    execute: (ctx) => {
      const bodyText = ctx.doc('body').text().trim().toLowerCase();
      const hasComparison = /(?:vs\.?|versus|alternative|compared to|best |top |better than)/.test(bodyText);
      if (hasComparison) {
        return { id: '12.4', category: CATEGORY, title: 'Comparison content (vs, alternative, best)', severity: 'info', passed: true, details: 'Comparison content detected.' };
      }
      return { id: '12.4', category: CATEGORY, title: 'Comparison content (vs, alternative, best)', severity: 'info', passed: false, details: 'No comparison content detected.', recommendation: 'Add comparison content (vs, alternatives, best-of) for AI comparison answers.' };
    },
  },
  {
    id: '12.5',
    title: 'Statistics and data with sources',
    severity: 'info',
    execute: (ctx) => {
      const bodyText = ctx.doc('body').text().trim();
      const hasStats = /\b\d{1,3}(,\d{3})*(\.\d+)?%?\b/.test(bodyText);
      const hasCitation = ctx.doc('cite, a[href^="http"]').length > 2;
      if (hasStats && hasCitation) {
        return { id: '12.5', category: CATEGORY, title: 'Statistics and data with sources', severity: 'info', passed: true, details: 'Statistics with external references found.' };
      }
      if (hasStats) {
        return { id: '12.5', category: CATEGORY, title: 'Statistics and data with sources', severity: 'info', passed: false, details: 'Statistics found but no source citations.', recommendation: 'Add source citations to statistics for credible AI citations.' };
      }
      return { id: '12.5', category: CATEGORY, title: 'Statistics and data with sources', severity: 'info', passed: false, details: 'No statistics detected.', recommendation: 'Include statistics and data with sources for credible AI citations.' };
    },
  },
  {
    id: '12.6',
    title: 'Brand name mentioned naturally in content',
    severity: 'info',
    execute: (ctx) => {
      const hostname = ctx.url.hostname.replace(/^www\./, '');
      const bodyText = ctx.doc('body').text().trim().toLowerCase();
      const brand = hostname.split('.')[0];
      const count = bodyText.split(brand.toLowerCase()).length - 1;
      if (count >= 2) {
        return { id: '12.6', category: CATEGORY, title: 'Brand name mentioned naturally in content', severity: 'info', passed: true, value: count, details: `Brand "${brand}" mentioned ${count} times.` };
      }
      return { id: '12.6', category: CATEGORY, title: 'Brand name mentioned naturally in content', severity: 'info', passed: false, details: `Brand "${brand}" not mentioned enough.`, recommendation: 'Mention your brand name naturally in the content for brand-entity association.' };
    },
  },
  {
    id: '12.7',
    title: 'Consistent entity naming across pages',
    severity: 'info',
    execute: () => ({ id: '12.7', category: CATEGORY, title: 'Consistent entity naming across pages', severity: 'info', passed: false, details: 'Check requires multi-page analysis. Deferred.' }),
  },
];
