import type { CheckDefinition } from '../types';

const CATEGORY = 'Social & Rich Media';

export const socialRichMediaChecks: CheckDefinition[] = [
  {
    id: '7.1',
    title: 'Open Graph tags present',
    severity: 'warning',
    execute: (ctx) => {
      const ogTitle = ctx.doc('head meta[property="og:title"]').attr('content') || '';
      const ogDesc = ctx.doc('head meta[property="og:description"]').attr('content') || '';
      const ogImage = ctx.doc('head meta[property="og:image"]').attr('content') || '';
      const missing = [];
      if (!ogTitle) missing.push('og:title');
      if (!ogDesc) missing.push('og:description');
      if (!ogImage) missing.push('og:image');
      if (missing.length > 0) {
        return { id: '7.1', category: CATEGORY, title: 'Open Graph tags present', severity: 'warning', passed: false, details: `Missing Open Graph tags: ${missing.join(', ')}.`, recommendation: 'Add og:title, og:description, and og:image meta tags.' };
      }
      return { id: '7.1', category: CATEGORY, title: 'Open Graph tags present', severity: 'warning', passed: true, details: 'All required Open Graph tags present.' };
    },
  },
  {
    id: '7.2',
    title: 'Twitter Card tags present',
    severity: 'info',
    execute: (ctx) => {
      const twitterCard = ctx.doc('head meta[name="twitter:card"]').attr('content') || '';
      if (!twitterCard) {
        return { id: '7.2', category: CATEGORY, title: 'Twitter Card tags present', severity: 'info', passed: false, details: 'No twitter:card meta tag found.', recommendation: 'Add <meta name="twitter:card" content="summary_large_image">.' };
      }
      return { id: '7.2', category: CATEGORY, title: 'Twitter Card tags present', severity: 'info', passed: true, value: twitterCard, details: `Twitter card type: ${twitterCard}.` };
    },
  },
  {
    id: '7.3',
    title: 'Structured data (JSON-LD) present',
    severity: 'warning',
    execute: (ctx) => {
      const jsonLd = ctx.doc('head script[type="application/ld+json"]');
      if (jsonLd.length === 0) {
        return { id: '7.3', category: CATEGORY, title: 'Structured data (JSON-LD) present', severity: 'warning', passed: false, details: 'No JSON-LD structured data found.', recommendation: 'Add JSON-LD structured data for better rich results.' };
      }
      return { id: '7.3', category: CATEGORY, title: 'Structured data (JSON-LD) present', severity: 'warning', passed: true, value: jsonLd.length, details: `Found ${jsonLd.length} JSON-LD block(s).` };
    },
  },
];
