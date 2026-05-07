import type { CheckDefinition } from '../types';

const CATEGORY = 'Entity & Authority Signals';

function findLinkByText(ctx: Parameters<CheckDefinition['execute']>[0], text: string): boolean {
  let found = false;
  ctx.doc('a').each((_, el) => {
    if (ctx.doc(el).text().trim().toLowerCase().includes(text)) {
      found = true;
    }
  });
  return found;
}

export const entityAuthorityChecks: CheckDefinition[] = [
  {
    id: '9.1',
    title: 'Author byline with credentials/expertise',
    severity: 'warning',
    execute: (ctx) => {
      const authorMeta = ctx.doc('head meta[name="author"]').attr('content') || '';
      const relAuthor = ctx.doc('head meta[property="article:author"]').attr('content') || '';
      const hasByline = ctx.doc('[class*="author"], [class*="byline"]').length > 0;
      if (authorMeta || relAuthor || hasByline) {
        return { id: '9.1', category: CATEGORY, title: 'Author byline with credentials/expertise', severity: 'warning', passed: true, value: authorMeta || 'detected', details: 'Author attribution found.' };
      }
      return { id: '9.1', category: CATEGORY, title: 'Author byline with credentials/expertise', severity: 'warning', passed: false, details: 'No author byline found.', recommendation: 'Add visible author byline with credentials for E-E-A-T.' };
    },
  },
  {
    id: '9.2',
    title: 'Author Person schema markup',
    severity: 'info',
    execute: (ctx) => {
      const blocks = ctx.doc('script[type="application/ld+json"]');
      let found = false;
      blocks.each((_, el) => {
        try {
          const content = ctx.doc(el).text().trim();
          const data = JSON.parse(content);
          const items = Array.isArray(data) ? data : [data];
          const check = (obj: Record<string, unknown>) => {
            const t = obj['@type'];
            if (t === 'Person') found = true;
            if (obj.author && typeof obj.author === 'object') check(obj.author as Record<string, unknown>);
          };
          for (const item of items) check(item);
        } catch {
          // malformed
        }
      });
      if (found) {
        return { id: '9.2', category: CATEGORY, title: 'Author Person schema markup', severity: 'info', passed: true, details: 'Person schema found for author.' };
      }
      return { id: '9.2', category: CATEGORY, title: 'Author Person schema markup', severity: 'info', passed: false, details: 'No Person schema for author found.', recommendation: 'Add Person schema for author entity resolution.' };
    },
  },
  {
    id: '9.3',
    title: 'Publication/last-modified date visible',
    severity: 'warning',
    execute: (ctx) => {
      const dateMeta = ctx.doc('head meta[property="article:published_time"], head meta[property="article:modified_time"]');
      const dateElements = ctx.doc('time, [class*="date"], [class*="published"]');
      if (dateMeta.length > 0 || dateElements.length > 0) {
        return { id: '9.3', category: CATEGORY, title: 'Publication/last-modified date visible', severity: 'warning', passed: true, details: 'Publication date found.' };
      }
      return { id: '9.3', category: CATEGORY, title: 'Publication/last-modified date visible', severity: 'warning', passed: false, details: 'No publication date found.', recommendation: 'Add visible publication or last-modified date for freshness signals.' };
    },
  },
  {
    id: '9.4',
    title: 'Citations and references to authoritative sources',
    severity: 'info',
    execute: (ctx) => {
      const hasCitations = findLinkByText(ctx, 'source') || findLinkByText(ctx, 'reference') || ctx.doc('cite, blockquote').length > 0;
      const hasExternalLinks = ctx.doc('a[href^="http"]').length > 3;
      if (hasCitations || hasExternalLinks) {
        return { id: '9.4', category: CATEGORY, title: 'Citations and references to authoritative sources', severity: 'info', passed: true, details: 'External references or citations detected.' };
      }
      return { id: '9.4', category: CATEGORY, title: 'Citations and references to authoritative sources', severity: 'info', passed: false, details: 'No citations or external references found.', recommendation: 'Add citations and links to authoritative sources for claim verifiability.' };
    },
  },
  {
    id: '9.5',
    title: 'About page with company/entity details',
    severity: 'warning',
    execute: (ctx) => {
      const hasAboutLink = findLinkByText(ctx, 'about') || ctx.doc('a[href*="about"]').length > 0;
      if (hasAboutLink) {
        return { id: '9.5', category: CATEGORY, title: 'About page with company/entity details', severity: 'warning', passed: true, details: 'About page link found.' };
      }
      return { id: '9.5', category: CATEGORY, title: 'About page with company/entity details', severity: 'warning', passed: false, details: 'No About page link detected.', recommendation: 'Add an About page with company/entity details for entity grounding.' };
    },
  },
  {
    id: '9.6',
    title: 'Contact information clearly presented',
    severity: 'warning',
    execute: (ctx) => {
      const hasContactLink = findLinkByText(ctx, 'contact') || ctx.doc('a[href*="contact"], a[href*="mailto:"]').length > 0;
      if (hasContactLink) {
        return { id: '9.6', category: CATEGORY, title: 'Contact information clearly presented', severity: 'warning', passed: true, details: 'Contact information found.' };
      }
      return { id: '9.6', category: CATEGORY, title: 'Contact information clearly presented', severity: 'warning', passed: false, details: 'No contact information detected.', recommendation: 'Add visible contact information for trust signals.' };
    },
  },
  {
    id: '9.7',
    title: 'Privacy policy and terms of service pages',
    severity: 'info',
    execute: (ctx) => {
      const hasPrivacy = findLinkByText(ctx, 'privacy') || ctx.doc('a[href*="privacy"]').length > 0;
      const hasTerms = findLinkByText(ctx, 'terms') || ctx.doc('a[href*="terms"]').length > 0;
      const missing = [];
      if (!hasPrivacy) missing.push('privacy policy');
      if (!hasTerms) missing.push('terms of service');
      if (missing.length > 0) {
        return { id: '9.7', category: CATEGORY, title: 'Privacy policy and terms of service pages', severity: 'info', passed: false, details: `Missing: ${missing.join(', ')}.`, recommendation: 'Add privacy policy and terms of service pages for legitimacy.' };
      }
      return { id: '9.7', category: CATEGORY, title: 'Privacy policy and terms of service pages', severity: 'info', passed: true, details: 'Privacy policy and terms found.' };
    },
  },
];
