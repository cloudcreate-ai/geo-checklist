import type { CheckDefinition } from '../types';

const CATEGORY = 'Content Format for AI Extraction';

export const contentFormatChecks: CheckDefinition[] = [
  {
    id: '10.1',
    title: 'FAQ sections with clear Q&A pairs',
    severity: 'info',
    execute: (ctx) => {
      const hasFAQ = ctx.doc('details, [class*="faq"], [id*="faq"], [class*="accordion"]').length > 0;
      if (hasFAQ) {
        return { id: '10.1', category: CATEGORY, title: 'FAQ sections with clear Q&A pairs', severity: 'info', passed: true, details: 'FAQ section structure detected.' };
      }
      return { id: '10.1', category: CATEGORY, title: 'FAQ sections with clear Q&A pairs', severity: 'info', passed: false, details: 'No FAQ structure found.', recommendation: 'Add FAQ sections with clear Q&A pairs for direct AI answer extraction.' };
    },
  },
  {
    id: '10.2',
    title: 'Summary/conclusion paragraphs',
    severity: 'info',
    execute: (ctx) => {
      const paragraphs = ctx.doc('p');
      let hasSummary = false;
      paragraphs.each((_, el) => {
        const text = ctx.doc(el).text().trim().toLowerCase();
        if (text.startsWith('in summary') || text.startsWith('in conclusion') || text.startsWith('to summarize') || text.startsWith('key takeaways')) {
          hasSummary = true;
        }
      });
      if (hasSummary) {
        return { id: '10.2', category: CATEGORY, title: 'Summary/conclusion paragraphs', severity: 'info', passed: true, details: 'Summary or conclusion paragraph found.' };
      }
      return { id: '10.2', category: CATEGORY, title: 'Summary/conclusion paragraphs', severity: 'info', passed: false, details: 'No explicit summary or conclusion detected.', recommendation: 'Add a summary paragraph so AI can cite key points.' };
    },
  },
  {
    id: '10.3',
    title: 'Bullet lists and numbered steps',
    severity: 'info',
    execute: (ctx) => {
      const hasLists = ctx.doc('ul, ol').length > 0;
      if (hasLists) {
        return { id: '10.3', category: CATEGORY, title: 'Bullet lists and numbered steps', severity: 'info', passed: true, details: 'Lists detected.' };
      }
      return { id: '10.3', category: CATEGORY, title: 'Bullet lists and numbered steps', severity: 'info', passed: false, details: 'No bulleted or numbered lists found.', recommendation: 'Use bullet lists and numbered steps for structured AI extraction.' };
    },
  },
  {
    id: '10.4',
    title: 'Tables for comparison data',
    severity: 'info',
    execute: (ctx) => {
      const hasTables = ctx.doc('table').length > 0;
      if (hasTables) {
        return { id: '10.4', category: CATEGORY, title: 'Tables for comparison data', severity: 'info', passed: true, details: 'Tables found.' };
      }
      return { id: '10.4', category: CATEGORY, title: 'Tables for comparison data', severity: 'info', passed: false, details: 'No tables found.', recommendation: 'Use tables for comparison data to enable easy AI parsing.' };
    },
  },
  {
    id: '10.5',
    title: 'Clear topic sentences per paragraph',
    severity: 'info',
    execute: (ctx) => {
      const paragraphs = ctx.doc('p');
      let emptyCount = 0;
      paragraphs.each((_, el) => {
        const text = ctx.doc(el).text().trim();
        if (text.length < 15) emptyCount++;
      });
      const shortRatio = paragraphs.length > 0 ? emptyCount / paragraphs.length : 1;
      if (shortRatio > 0.5) {
        return { id: '10.5', category: CATEGORY, title: 'Clear topic sentences per paragraph', severity: 'info', passed: false, details: `${Math.round(shortRatio * 100)}% of paragraphs are very short.`, recommendation: 'Ensure paragraphs have clear topic sentences for paragraph-level AI extraction.' };
      }
      return { id: '10.5', category: CATEGORY, title: 'Clear topic sentences per paragraph', severity: 'info', passed: true, details: 'Paragraphs appear to have sufficient content.' };
    },
  },
  {
    id: '10.6',
    title: 'Definitions of key terms (glossary style)',
    severity: 'info',
    execute: (ctx) => {
      const hasDl = ctx.doc('dl, dt, dd').length > 0;
      const hasDefinition = ctx.doc('p').toArray().some((el) => {
        const text = ctx.doc(el).text().trim();
        return /^\w+[\s:]+(?:means|is defined as|refers to|is a|is an)/i.test(text.substring(0, 80));
      });
      if (hasDl || hasDefinition) {
        return { id: '10.6', category: CATEGORY, title: 'Definitions of key terms (glossary style)', severity: 'info', passed: true, details: 'Term definitions detected.' };
      }
      return { id: '10.6', category: CATEGORY, title: 'Definitions of key terms (glossary style)', severity: 'info', passed: false, details: 'No glossary-style definitions found.', recommendation: 'Add definition-style content for term-entity mapping.' };
    },
  },
  {
    id: '10.7',
    title: 'Content not hidden in JS-only components',
    severity: 'warning',
    execute: (ctx) => {
      const hasNoscript = ctx.doc('noscript').length > 0;
      const bodyText = ctx.doc('body').text().trim();
      const hasScripts = ctx.doc('script').length;
      if (bodyText.length > 200 || hasNoscript) {
        return { id: '10.7', category: CATEGORY, title: 'Content not hidden in JS-only components', severity: 'warning', passed: true, details: 'Substantial server-rendered content detected.' };
      }
      if (hasScripts > 5 && bodyText.length < 100) {
        return { id: '10.7', category: CATEGORY, title: 'Content not hidden in JS-only components', severity: 'warning', passed: false, details: 'Many scripts but little body text — content may be JS-rendered.', recommendation: 'Ensure key content is in the initial HTML response, not loaded via JS.' };
      }
      return { id: '10.7', category: CATEGORY, title: 'Content not hidden in JS-only components', severity: 'warning', passed: true, details: 'Content appears accessible to AI crawlers.' };
    },
  },
];
