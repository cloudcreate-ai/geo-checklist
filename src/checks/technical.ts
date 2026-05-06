import type { CheckDefinition } from '../types';
import { FETCH_TIMEOUT_MS } from '../config';

const CATEGORY = 'Technical';

export const technicalChecks: CheckDefinition[] = [
  {
    id: '6.1',
    title: 'Page served over HTTPS',
    severity: 'critical',
    execute: (ctx) => {
      const isHttps = ctx.url.protocol === 'https:';
      if (!isHttps) {
        return { id: '6.1', category: CATEGORY, title: 'Page served over HTTPS', severity: 'critical', passed: false, details: 'Page is not served over HTTPS.', recommendation: 'Configure HTTPS for all pages.' };
      }
      return { id: '6.1', category: CATEGORY, title: 'Page served over HTTPS', severity: 'critical', passed: true, details: 'Page is served over HTTPS.' };
    },
  },
  {
    id: '6.2',
    title: 'Page loads in under 3 seconds (LCP)',
    severity: 'critical',
    execute: (ctx) => {
      if (ctx.loadTimeMs > 3000) {
        return { id: '6.2', category: CATEGORY, title: 'Page loads in under 3 seconds (LCP)', severity: 'critical', passed: false, value: ctx.loadTimeMs, details: `Page loaded in ${ctx.loadTimeMs}ms.`, recommendation: 'Optimize page load time to under 3 seconds.' };
      }
      return { id: '6.2', category: CATEGORY, title: 'Page loads in under 3 seconds (LCP)', severity: 'critical', passed: true, value: ctx.loadTimeMs, details: `Page loaded in ${ctx.loadTimeMs}ms.` };
    },
  },
  {
    id: '6.3',
    title: 'Mobile-responsive design',
    severity: 'critical',
    execute: () => ({ id: '6.3', category: CATEGORY, title: 'Mobile-responsive design', severity: 'critical', passed: false, details: 'Check requires headless browser or multi-page analysis. Deferred to Phase 2.' }),
  },
  {
    id: '6.4',
    title: 'No intrusive interstitials',
    severity: 'warning',
    execute: () => ({ id: '6.4', category: CATEGORY, title: 'No intrusive interstitials', severity: 'warning', passed: false, details: 'Check requires headless browser visual analysis. Deferred to Phase 2.' }),
  },
  {
    id: '6.5',
    title: 'Favicon present',
    severity: 'info',
    execute: (ctx) => {
      const favicon = ctx.doc('head link[rel="icon"], head link[rel="shortcut icon"]');
      if (favicon.length === 0) {
        return { id: '6.5', category: CATEGORY, title: 'Favicon present', severity: 'info', passed: false, details: 'No favicon link found.', recommendation: 'Add a <link rel="icon"> for branding.' };
      }
      return { id: '6.5', category: CATEGORY, title: 'Favicon present', severity: 'info', passed: true, details: 'Favicon found.' };
    },
  },
  {
    id: '6.6',
    title: '404 page exists and is helpful',
    severity: 'warning',
    execute: () => ({ id: '6.6', category: CATEGORY, title: '404 page exists and is helpful', severity: 'warning', passed: false, details: 'Check requires crawling a non-existent URL. Deferred to Phase 2.' }),
  },
  {
    id: '6.7',
    title: 'Server returns correct status codes',
    severity: 'critical',
    execute: (ctx) => {
      if (ctx.status >= 200 && ctx.status < 400) {
        return { id: '6.7', category: CATEGORY, title: 'Server returns correct status codes', severity: 'critical', passed: true, value: ctx.status, details: `HTTP ${ctx.status} returned.` };
      }
      return { id: '6.7', category: CATEGORY, title: 'Server returns correct status codes', severity: 'critical', passed: false, value: ctx.status, details: `HTTP ${ctx.status} returned.`, recommendation: 'Ensure page returns a 200 status code.' };
    },
  },
  {
    id: '6.8',
    title: 'Content is server-rendered or SSR/SSG',
    severity: 'warning',
    execute: (ctx) => {
      const bodyText = ctx.doc('body').text().trim();
      if (bodyText.length < 50) {
        return { id: '6.8', category: CATEGORY, title: 'Content is server-rendered or SSR/SSG', severity: 'warning', passed: false, details: 'Very little body content — may be client-rendered SPA.', recommendation: 'Use server-side rendering (SSR) or static site generation (SSG) for crawlability.' };
      }
      return { id: '6.8', category: CATEGORY, title: 'Content is server-rendered or SSR/SSG', severity: 'warning', passed: true, details: 'Sufficient server-side content detected.' };
    },
  },
];
