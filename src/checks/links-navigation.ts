import type { CheckDefinition } from '../types';

const CATEGORY = 'Links & Navigation';

export const linksNavigationChecks: CheckDefinition[] = [
  {
    id: '5.1',
    title: 'Internal links use descriptive anchor text',
    severity: 'info',
    execute: (ctx) => {
      const links = ctx.doc('a[href]');
      let emptyAnchors = 0;
      links.each((_, el) => {
        const text = ctx.doc(el).text().trim();
        const img = ctx.doc(el).find('img');
        if (!text && img.length === 0) {
          emptyAnchors++;
        }
      });
      if (emptyAnchors > 0) {
        return { id: '5.1', category: CATEGORY, title: 'Internal links use descriptive anchor text', severity: 'info', passed: false, value: emptyAnchors, details: `${emptyAnchors} link(s) with empty or non-descriptive anchor text.`, recommendation: 'Add descriptive text to all links.' };
      }
      return { id: '5.1', category: CATEGORY, title: 'Internal links use descriptive anchor text', severity: 'info', passed: true, details: 'Links have descriptive anchor text.' };
    },
  },
  {
    id: '5.2',
    title: 'No broken links (404s)',
    severity: 'critical',
    execute: () => ({ id: '5.2', category: CATEGORY, title: 'No broken links (404s)', severity: 'critical', passed: false, details: 'Check requires fetching every link on page. Deferred to Phase 2.' }),
  },
  {
    id: '5.3',
    title: 'No redirect chains',
    severity: 'warning',
    execute: () => ({ id: '5.3', category: CATEGORY, title: 'No redirect chains', severity: 'warning', passed: false, details: 'Check requires following redirect chains per link. Deferred to Phase 2.' }),
  },
  {
    id: '5.4',
    title: 'Breadcrumb navigation present',
    severity: 'info',
    execute: (ctx) => {
      const hasBreadcrumb = ctx.doc('nav[aria-label="Breadcrumb"], [class*="breadcrumb"], ol:has(> li > a[href])').length > 0;
      const navElements = ctx.doc('nav');
      if (!hasBreadcrumb && navElements.length === 0) {
        return { id: '5.4', category: CATEGORY, title: 'Breadcrumb navigation present', severity: 'info', passed: false, details: 'No breadcrumb navigation or nav elements found.', recommendation: 'Add breadcrumb navigation for site structure.' };
      }
      return { id: '5.4', category: CATEGORY, title: 'Breadcrumb navigation present', severity: 'info', passed: true, details: 'Navigation structure detected.' };
    },
  },
  {
    id: '5.5',
    title: 'Logical URL structure',
    severity: 'info',
    execute: (ctx) => {
      const url = ctx.url.pathname;
      const hasParams = url.includes('?');
      const hasLongSegments = url.split('/').some((s) => s.length > 50);
      if (hasParams && hasLongSegments) {
        return { id: '5.5', category: CATEGORY, title: 'Logical URL structure', severity: 'info', passed: false, details: 'URL has query params and very long path segments.', recommendation: 'Use clean, semantic URLs with short, descriptive segments.' };
      }
      return { id: '5.5', category: CATEGORY, title: 'Logical URL structure', severity: 'info', passed: true, value: url, details: `URL: ${url}.` };
    },
  },
  {
    id: '5.6',
    title: 'Sitemap exists and is valid',
    severity: 'warning',
    execute: (ctx) => {
      if (!ctx.sitemapXml) {
        return { id: '5.6', category: CATEGORY, title: 'Sitemap exists and is valid', severity: 'warning', passed: false, details: 'No sitemap found at /sitemap.xml.', recommendation: 'Create a sitemap.xml at the root of your site.' };
      }
      if (ctx.sitemapXml.includes('<urlset') || ctx.sitemapXml.includes('<sitemapindex')) {
        return { id: '5.6', category: CATEGORY, title: 'Sitemap exists and is valid', severity: 'warning', passed: true, details: 'Valid sitemap found.' };
      }
      return { id: '5.6', category: CATEGORY, title: 'Sitemap exists and is valid', severity: 'warning', passed: false, details: 'Sitemap found but does not appear to be valid XML.', recommendation: 'Ensure sitemap follows sitemap.xml format.' };
    },
  },
  {
    id: '5.7',
    title: 'Robots.txt exists and correctly configured',
    severity: 'warning',
    execute: (ctx) => {
      if (!ctx.robotsTxt) {
        return { id: '5.7', category: CATEGORY, title: 'Robots.txt exists and correctly configured', severity: 'warning', passed: false, details: 'No robots.txt found.', recommendation: 'Create a robots.txt at the root of your site.' };
      }
      const blocksAll = ctx.robotsTxt.includes('Disallow: /');
      if (blocksAll) {
        return { id: '5.7', category: CATEGORY, title: 'Robots.txt exists and correctly configured', severity: 'warning', passed: false, details: 'robots.txt disallows all crawling.', recommendation: 'Review robots.txt — "Disallow: /" blocks all search engine crawlers.' };
      }
      return { id: '5.7', category: CATEGORY, title: 'Robots.txt exists and correctly configured', severity: 'warning', passed: true, details: 'robots.txt found and allows crawling.' };
    },
  },
];
