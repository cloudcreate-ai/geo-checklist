import type { CheckDefinition } from '../types';

const CATEGORY = 'Structured Data & Semantics';

/**
 * Parse JSON-LD blocks and check for specific @type values.
 */
function getJsonLdTypes(ctx: Parameters<CheckDefinition['execute']>[0]): Set<string> {
  const types = new Set<string>();
  ctx.doc('head script[type="application/ld+json"], body script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = ctx.doc(el).text().trim();
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type']) {
          const t = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
          for (const s of t) types.add(s);
        }
        if (item['@graph']) {
          for (const sub of item['@graph']) {
            if (sub['@type']) {
              const t2 = Array.isArray(sub['@type']) ? sub['@type'] : [sub['@type']];
              for (const s of t2) types.add(s);
            }
          }
        }
      }
    } catch {
      // malformed JSON-LD
    }
  });
  return types;
}

function getJsonLdBlocks(ctx: Parameters<CheckDefinition['execute']>[0]): Record<string, unknown>[] {
  const all: Record<string, unknown>[] = [];
  ctx.doc('head script[type="application/ld+json"], body script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = ctx.doc(el).text().trim();
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      all.push(...items);
      for (const item of items) {
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          all.push(...(item['@graph'] as Record<string, unknown>[]));
        }
      }
    } catch {
      // malformed
    }
  });
  return all;
}

function hasType(ctx: Parameters<CheckDefinition['execute']>[0], types: string[]): boolean {
  const found = getJsonLdTypes(ctx);
  return types.some((t) => found.has(t));
}

export const structuredDataChecks: CheckDefinition[] = [
  {
    id: '8.1',
    title: 'Schema.org Organization markup present',
    severity: 'warning',
    execute: (ctx) => {
      if (hasType(ctx, ['Organization'])) {
        return { id: '8.1', category: CATEGORY, title: 'Schema.org Organization markup present', severity: 'warning', passed: true, details: 'Organization schema found.' };
      }
      return { id: '8.1', category: CATEGORY, title: 'Schema.org Organization markup present', severity: 'warning', passed: false, details: 'No Organization schema found.', recommendation: 'Add Organization schema with name, logo, and contact info.' };
    },
  },
  {
    id: '8.2',
    title: 'Schema.org WebSite + SearchAction markup',
    severity: 'info',
    execute: (ctx) => {
      const blocks = getJsonLdBlocks(ctx);
      const webSiteBlocks = blocks.filter((b) => {
        const t = b['@type'];
        return Array.isArray(t) ? t.includes('WebSite') : t === 'WebSite';
      });
      const hasSearchAction = webSiteBlocks.some((b) => b.potentialAction);
      if (hasType(ctx, ['WebSite'])) {
        if (hasSearchAction) {
          return { id: '8.2', category: CATEGORY, title: 'Schema.org WebSite + SearchAction markup', severity: 'info', passed: true, details: 'WebSite schema with SearchAction found.' };
        }
        return { id: '8.2', category: CATEGORY, title: 'Schema.org WebSite + SearchAction markup', severity: 'info', passed: false, details: 'WebSite schema found but no SearchAction.', recommendation: 'Add SearchAction for sitelinks search box.' };
      }
      return { id: '8.2', category: CATEGORY, title: 'Schema.org WebSite + SearchAction markup', severity: 'info', passed: false, details: 'No WebSite schema found.', recommendation: 'Add WebSite schema with SearchAction for sitelinks search.' };
    },
  },
  {
    id: '8.3',
    title: 'Schema.org Article / BlogPosting for content pages',
    severity: 'warning',
    execute: (ctx) => {
      if (hasType(ctx, ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'])) {
        return { id: '8.3', category: CATEGORY, title: 'Schema.org Article / BlogPosting for content pages', severity: 'warning', passed: true, details: 'Article-type schema found.' };
      }
      return { id: '8.3', category: CATEGORY, title: 'Schema.org Article / BlogPosting for content pages', severity: 'warning', passed: false, details: 'No article-type schema found.', recommendation: 'Add Article or BlogPosting schema for content pages.' };
    },
  },
  {
    id: '8.4',
    title: 'Schema.org FAQPage / QAPage where applicable',
    severity: 'info',
    execute: (ctx) => {
      if (hasType(ctx, ['FAQPage', 'QAPage'])) {
        return { id: '8.4', category: CATEGORY, title: 'Schema.org FAQPage / QAPage where applicable', severity: 'info', passed: true, details: 'FAQ/QA schema found.' };
      }
      return { id: '8.4', category: CATEGORY, title: 'Schema.org FAQPage / QAPage where applicable', severity: 'info', passed: false, details: 'No FAQ/QA schema found.', recommendation: 'Add FAQPage schema if the page contains Q&A content.' };
    },
  },
  {
    id: '8.5',
    title: 'Schema.org Product / Service where applicable',
    severity: 'info',
    execute: (ctx) => {
      if (hasType(ctx, ['Product', 'Service', 'SoftwareApplication'])) {
        return { id: '8.5', category: CATEGORY, title: 'Schema.org Product / Service where applicable', severity: 'info', passed: true, details: 'Product/Service schema found.' };
      }
      return { id: '8.5', category: CATEGORY, title: 'Schema.org Product / Service where applicable', severity: 'info', passed: false, details: 'No Product/Service schema found.', recommendation: 'Add Product or Service schema if the page describes offerings.' };
    },
  },
  {
    id: '8.6',
    title: 'sameAs links to official social profiles',
    severity: 'warning',
    execute: (ctx) => {
      const blocks = getJsonLdBlocks(ctx);
      const hasSameAs = blocks.some((b) => b.sameAs && Array.isArray(b.sameAs) && (b.sameAs as string[]).length > 0);
      if (hasSameAs) {
        return { id: '8.6', category: CATEGORY, title: 'sameAs links to official social profiles', severity: 'warning', passed: true, details: 'sameAs social links found in structured data.' };
      }
      return { id: '8.6', category: CATEGORY, title: 'sameAs links to official social profiles', severity: 'warning', passed: false, details: 'No sameAs social links found.', recommendation: 'Add sameAs property linking to official social profiles for entity resolution.' };
    },
  },
  {
    id: '8.7',
    title: 'knowsAbout / about properties on content',
    severity: 'info',
    execute: (ctx) => {
      const blocks = getJsonLdBlocks(ctx);
      const hasTopic = blocks.some((b) => b.knowsAbout || b.about);
      if (hasTopic) {
        return { id: '8.7', category: CATEGORY, title: 'knowsAbout / about properties on content', severity: 'info', passed: true, details: 'Topic-entity mapping found.' };
      }
      return { id: '8.7', category: CATEGORY, title: 'knowsAbout / about properties on content', severity: 'info', passed: false, details: 'No knowsAbout/about properties found.', recommendation: 'Add about or knowsAbout properties to map content topics.' };
    },
  },
];
