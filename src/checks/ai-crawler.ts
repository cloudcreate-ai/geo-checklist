import type { CheckDefinition } from '../types';

const CATEGORY = 'AI Crawler Accessibility';

export const aiCrawlerChecks: CheckDefinition[] = [
  {
    id: '11.1',
    title: 'Content is server-rendered, not SPA-only',
    severity: 'critical',
    execute: (ctx) => {
      const bodyText = ctx.doc('body').text().trim();
      const scriptCount = ctx.doc('script[src]').length;
      if (bodyText.length > 100) {
        return { id: '11.1', category: CATEGORY, title: 'Content is server-rendered, not SPA-only', severity: 'critical', passed: true, details: 'Server-rendered content detected.' };
      }
      if (scriptCount > 3 && bodyText.length < 50) {
        return { id: '11.1', category: CATEGORY, title: 'Content is server-rendered, not SPA-only', severity: 'critical', passed: false, details: 'Few scripts but minimal body — likely SSR, OK.', recommendation: 'Verify that key content is server-rendered, not client-only.' };
      }
      return { id: '11.1', category: CATEGORY, title: 'Content is server-rendered, not SPA-only', severity: 'critical', passed: true, details: 'Page appears accessible to AI crawlers.' };
    },
  },
  {
    id: '11.2',
    title: 'Robots.txt does not block AI crawlers',
    severity: 'critical',
    execute: (ctx) => {
      if (!ctx.robotsTxt) {
        return { id: '11.2', category: CATEGORY, title: 'Robots.txt does not block AI crawlers', severity: 'critical', passed: false, details: 'No robots.txt found.', recommendation: 'Ensure robots.txt exists and does not block AI crawlers.' };
      }
      const aiBots = ['GPTBot', 'Google-Extended', 'CCBot', 'anthropic-ai', 'PerplexityBot', 'Applebot-Extended'];
      const blockedBots: string[] = [];
      const lines = ctx.robotsTxt.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('disallow:')) {
          const path = trimmed.replace('disallow:', '').trim();
          if (path === '/') {
            blockedBots.push('all bots (root disallow)');
          }
        }
        for (const bot of aiBots) {
          if (trimmed.startsWith(`user-agent: ${bot.toLowerCase()}`)) {
            const nextIdx = lines.indexOf(line) + 1;
            if (nextIdx < lines.length && lines[nextIdx].trim().toLowerCase().startsWith('disallow: /')) {
              blockedBots.push(bot);
            }
          }
        }
      }
      if (blockedBots.length > 0) {
        return { id: '11.2', category: CATEGORY, title: 'Robots.txt does not block AI crawlers', severity: 'critical', passed: false, details: `AI bots blocked: ${blockedBots.join(', ')}.`, recommendation: 'Remove AI bot blocks from robots.txt for AI engine access.' };
      }
      return { id: '11.2', category: CATEGORY, title: 'Robots.txt does not block AI crawlers', severity: 'critical', passed: true, details: 'AI crawlers not blocked.' };
    },
  },
  {
    id: '11.3',
    title: 'No aggressive bot-detection (CAPTCHA walls)',
    severity: 'warning',
    execute: () => ({ id: '11.3', category: CATEGORY, title: 'No aggressive bot-detection (CAPTCHA walls)', severity: 'warning', passed: false, details: 'Requires browser rendering check.' }),
  },
  {
    id: '11.4',
    title: 'Clean HTML without excessive tracking scripts',
    severity: 'warning',
    execute: (ctx) => {
      const trackingScripts = ctx.doc('script[src*="analytics"], script[src*="pixel"], script[src*="track"], script[src*="tagmanager"], script[src*="gtag"]');
      const totalScripts = ctx.doc('script').length;
      const trackingRatio = totalScripts > 0 ? trackingScripts.length / totalScripts : 0;
      if (trackingScripts.length > 5) {
        return { id: '11.4', category: CATEGORY, title: 'Clean HTML without excessive tracking scripts', severity: 'warning', passed: false, value: trackingScripts.length, details: `${trackingScripts.length} tracking scripts detected.`, recommendation: 'Reduce tracking scripts for faster AI crawler parsing.' };
      }
      return { id: '11.4', category: CATEGORY, title: 'Clean HTML without excessive tracking scripts', severity: 'warning', passed: true, details: `${trackingScripts.length} tracking script(s).` };
    },
  },
  {
    id: '11.5',
    title: 'Text content not embedded in images',
    severity: 'warning',
    execute: (ctx) => {
      const images = ctx.doc('img');
      const imagesWithoutAlt = ctx.doc('img:not([alt])').length;
      const hasHeroImage = ctx.doc('img[class*="hero"], img[class*="banner"], img[src*="hero"], img[src*="banner"]').length > 0;
      const bodyText = ctx.doc('body').text().trim();
      if (hasHeroImage && imagesWithoutAlt > images.length * 0.5 && bodyText.length < 100) {
        return { id: '11.5', category: CATEGORY, title: 'Text content not embedded in images', severity: 'warning', passed: false, details: 'Likely text-heavy images without alt text.', recommendation: 'Avoid embedding important text in images; use real HTML text.' };
      }
      return { id: '11.5', category: CATEGORY, title: 'Text content not embedded in images', severity: 'warning', passed: true, details: 'Content appears to be text-based.' };
    },
  },
  {
    id: '11.6',
    title: 'No noindex on important pages',
    severity: 'critical',
    execute: (ctx) => {
      const noindex = ctx.doc('head meta[name="robots"]').attr('content')?.includes('noindex') ?? false;
      const noindexX = ctx.doc('head meta[name="googlebot"]').attr('content')?.includes('noindex') ?? false;
      if (noindex || noindexX) {
        return { id: '11.6', category: CATEGORY, title: 'No noindex on important pages', severity: 'critical', passed: false, details: 'Page has noindex directive.', recommendation: 'Remove noindex from important pages for AI indexability.' };
      }
      return { id: '11.6', category: CATEGORY, title: 'No noindex on important pages', severity: 'critical', passed: true, details: 'No noindex found.' };
    },
  },
  {
    id: '11.7',
    title: 'Sitemap accessible at standard path',
    severity: 'warning',
    execute: (ctx) => {
      if (ctx.sitemapXml) {
        return { id: '11.7', category: CATEGORY, title: 'Sitemap accessible at standard path', severity: 'warning', passed: true, details: 'Sitemap found at /sitemap.xml.' };
      }
      return { id: '11.7', category: CATEGORY, title: 'Sitemap accessible at standard path', severity: 'warning', passed: false, details: 'No sitemap found at /sitemap.xml.', recommendation: 'Ensure sitemap.xml is accessible at /sitemap.xml for AI discovery.' };
    },
  },
];
