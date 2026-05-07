import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import { FETCH_TIMEOUT_MS, BROWSER_PAGE_TIMEOUT_MS } from './config';
import { t, tf } from './i18n';

export interface BrowserContext {
  browser: Browser;
  page: Page;
}

export async function launchBrowser(): Promise<BrowserContext> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  return { browser, page };
}

export async function closeBrowser(ctx: BrowserContext): Promise<void> {
  await ctx.browser.close();
}

export async function loadPage(page: Page, url: string, timeoutMs: number = BROWSER_PAGE_TIMEOUT_MS): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
}

// 6.3: Test mobile-responsive by checking viewport at mobile width
export async function testMobileResponsive(page: Page, url: string): Promise<{ passed: boolean; details: string; recommendation?: string }> {
  // Test at mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  await loadPage(page, url);
  const mobileWidth = await page.evaluate(() => {
    const html = document.documentElement;
    const viewport = document.querySelector('meta[name="viewport"]');
    const isResponsive = html.scrollWidth === window.innerWidth || window.innerWidth <= 375;
    return { isResponsive, viewportMeta: !!viewport };
  });

  // Check for horizontal overflow (non-responsive)
  const hasOverflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return body.scrollWidth > window.innerWidth * 1.2 || html.scrollWidth > window.innerWidth * 1.2;
  });

  if (!mobileWidth.isResponsive && !mobileWidth.viewportMeta) {
    return { passed: false, details: 'No viewport meta tag and content not mobile-adaptive.', recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> and use responsive CSS.' };
  }

  if (hasOverflow) {
    return { passed: false, details: 'Significant horizontal overflow at 375px viewport.', recommendation: 'Fix CSS to avoid horizontal scrolling on mobile.' };
  }

  return { passed: true, details: 'Page renders well at 375px mobile viewport.' };
}

// 6.4: Detect intrusive interstitials (overlays that block content)
export async function detectInterstitials(page: Page, url: string): Promise<{ passed: boolean; details: string; recommendation?: string }> {
  await page.setViewportSize({ width: 375, height: 812 });
  await loadPage(page, url);

  // Wait a moment for any interstitials to appear
  await page.waitForTimeout(1000);

  const overlayInfo = await page.evaluate(() => {
    const overlays: { element: string; opacity: number; coversPercent: number }[] = [];
    const elements = document.querySelectorAll('div, section, dialog');

    for (const el of Array.from(elements)) {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' && (style.backgroundColor !== 'transparent' || style.zIndex !== 'auto')) {
        const rect = el.getBoundingClientRect();
        const viewportArea = window.innerWidth * window.innerHeight;
        const elArea = rect.width * rect.height;
        const coversPercent = viewportArea > 0 ? (elArea / viewportArea) * 100 : 0;

        if (coversPercent > 30 && parseFloat(style.opacity) > 0.5) {
          overlays.push({
            element: el.className?.toString().substring(0, 50) || 'unknown',
            opacity: parseFloat(style.opacity),
            coversPercent: Math.round(coversPercent),
          });
        }
      }
    }

    return overlays;
  });

  if (overlayInfo.length > 0) {
    const worst = overlayInfo[0];
    return {
      passed: false,
      details: `Overlay detected (${worst.coversPercent}% coverage, class: ${worst.element}).`,
      recommendation: 'Remove intrusive interstitials that block content access.',
    };
  }

  return { passed: true, details: 'No intrusive interstitial overlays detected.' };
}

// 11.3: Detect CAPTCHA walls
export async function detectCaptcha(page: Page, url: string): Promise<{ passed: boolean; details: string }> {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loadPage(page, url);

  const captchaSignals = await page.evaluate(() => {
    const bodyText = document.body.textContent?.toLowerCase() || '';
    const frames = document.querySelectorAll('iframe');
    const forms = document.querySelectorAll('form');

    const captchaPatterns = [
      /captcha/i,
      /i'?m not a robot/i,
      /verify you'?re human/i,
      /recaptcha/i,
      /cloudflare.*challenge/i,
      /security check/i,
      /prove you are human/i,
      /access denied.*robot/i,
      /please verify your identity/i,
    ];

    const hasCaptchaText = captchaPatterns.some((p) => p.test(bodyText));
    const hasCaptchaIframe = Array.from(frames).some((f) =>
      /recaptcha|captcha|challenges?|cloudflare/i.test(f.src || '')
    );
    const hasCaptchaForm = Array.from(forms).some((f) =>
      /captcha|recaptcha|cf-turnstile/i.test(f.innerHTML || '')
    );
    const hasCaptchaClass = document.querySelectorAll('[class*="captcha"], [class*="recaptcha"], [class*="turnstile"]').length > 0;

    return {
      hasCaptchaText,
      hasCaptchaIframe,
      hasCaptchaForm,
      hasCaptchaClass,
    };
  });

  const hasCaptcha = captchaSignals.hasCaptchaText || captchaSignals.hasCaptchaIframe || captchaSignals.hasCaptchaForm || captchaSignals.hasCaptchaClass;

  if (hasCaptcha) {
    const signals = Object.entries(captchaSignals).filter(([, v]) => v).map(([k]) => k);
    return { passed: false, details: `Captcha/challenge detected (${signals.join(', ')}).` };
  }

  return { passed: true, details: 'No CAPTCHA or bot-detection walls detected.' };
}

// 6.6: Check if a non-existent URL returns a helpful 404 page
export async function check404Page(page: Page, baseUrl: string): Promise<{ passed: boolean; details: string; recommendation?: string }> {
  const randomPath = `/${Math.random().toString(36).substring(2, 10)}-not-found-404`;
  const testUrl = new URL(randomPath, baseUrl).href;

  try {
    const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const statusCode = response?.status() || 0;
    const bodyText = await page.evaluate(() => document.body.textContent || '');

    if (statusCode === 404) {
      const hasHelpfulContent = /not found|404|page.*missing|sorry|does.*not exist/i.test(bodyText);
      if (hasHelpfulContent) {
        return { passed: true, details: `Custom 404 page with helpful content returned (HTTP ${statusCode}).` };
      }
      return { passed: false, details: '404 page exists but has minimal helpful content.', recommendation: 'Add a helpful message and navigation links to the 404 page.' };
    }

    // Some sites return 200 with a 404-like page — check content
    if (statusCode === 200 && /not found|404|page.*missing/i.test(bodyText)) {
      return { passed: false, details: 'Page returns HTTP 200 instead of 404 for non-existent URL.', recommendation: 'Return HTTP 404 status for missing pages.' };
    }

    return { passed: false, details: `Non-existent URL returns HTTP ${statusCode} with no 404 indication.`, recommendation: 'Implement a custom 404 page.' };
  } catch {
    return { passed: false, details: 'Failed to test 404 page — connection error.', recommendation: 'Ensure the site is accessible.' };
  }
}

// 5.2/5.3: Get all internal links and check for broken links + redirect chains
// Uses native fetch (not page.goto) to avoid destroying the page context
export interface LinkCheckResult {
  broken: { url: string; status: number }[];
  redirectChains: { url: string; chain: string[] }[];
}

export async function checkLinks(page: Page, baseUrl: string): Promise<LinkCheckResult> {
  // Collect internal links from the current page
  const links = await page.evaluate((baseUrl) => {
    const base = new URL(baseUrl);
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const internal: string[] = [];
    for (const a of anchors) {
      try {
        const url = new URL(a.href, base.href);
        if (url.hostname === base.hostname && url.pathname !== base.pathname && !a.href.startsWith('#')) {
          internal.push(url.href);
        }
      } catch {
        // Skip invalid URLs
      }
    }
    // Deduplicate
    return [...new Set(internal)];
  }, baseUrl);

  const broken: { url: string; status: number }[] = [];
  const redirectChains: { url: string; chain: string[] }[] = [];

  // Check each link using native fetch with redirect: 'manual' to detect chains
  const maxLinks = 50;
  for (const link of links.slice(0, maxLinks)) {
    try {
      // Use redirect: 'manual' to detect redirect chains
      const response = await page.evaluate(async (url) => {
        const chain: string[] = [url];
        let currentUrl = url;
        let status: number;
        try {
          const resp = await fetch(currentUrl, {
            method: 'HEAD',
            redirect: 'follow',
            signal: AbortSignal.timeout(10000),
          });
          status = resp.status;
          // The final URL after redirects
          if (resp.url !== currentUrl) {
            chain.push(resp.url);
          }
        } catch {
          // HEAD might not be supported, try GET
          const resp = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'follow',
            signal: AbortSignal.timeout(10000),
          });
          status = resp.status;
          if (resp.url !== currentUrl) {
            chain.push(resp.url);
          }
        }
        return { status, chain };
      }, link);

      if (response.chain.length > 1) {
        redirectChains.push({ url: link, chain: response.chain });
      }

      if (response.status >= 400) {
        broken.push({ url: link, status: response.status });
      }
    } catch {
      // Network error — treat as broken
      broken.push({ url: link, status: 0 });
    }
  }

  return { broken, redirectChains };
}

// 3.4: Extract dates from the page for freshness check
export async function extractDates(page: Page): Promise<{ passed: boolean; details: string; dates?: string[] }> {
  const dates = await page.evaluate(() => {
    const datePatterns: string[] = [];
    const bodyText = document.body.textContent || '';

    // Try <time> elements
    const timeElements = document.querySelectorAll('time[datetime]');
    timeElements.forEach((t) => datePatterns.push(t.getAttribute('datetime') || ''));

    // Try common meta tags
    const metaDate = document.querySelector('meta[name*="date"], meta[property*="article:published_time"]');
    if (metaDate) datePatterns.push(metaDate.getAttribute('content') || '');

    // Regex for date patterns (YYYY-MM-DD, DD/MM/YYYY, Month DD, YYYY)
    const dateRegexes = [
      /\d{4}-\d{2}-\d{2}/g,
      /\d{2}\/\d{2}\/\d{4}/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
    ];

    for (const regex of dateRegexes) {
      const matches = bodyText.match(regex);
      if (matches) datePatterns.push(...matches.slice(0, 5));
    }

    return [...new Set(datePatterns)];
  });

  if (dates.length > 0) {
    return { passed: true, details: `Found ${dates.length} date reference(s): ${dates.slice(0, 3).join(', ')}.`, dates };
  }

  return { passed: false, details: 'No publication or modification dates found on the page.', dates: [] };
}

// 3.2: Crawl local pages and analyze intent coverage
export interface PageSummary {
  url: string;
  title: string;
  h1: string;
  headings: string[];
  bodyText: string;
  metaDescription: string;
}

export async function crawlLocalPages(page: Page, baseUrl: string, maxPages: number = 20, verbose = false, maxDepth: number = 1, pageTimeout?: number): Promise<PageSummary[]> {
  const base = new URL(baseUrl);
  const allSeen = new Set<string>(); // all URLs discovered
  const crawledUrls = new Set<string>(); // pages already fetched & summarized
  const timeout = pageTimeout ?? BROWSER_PAGE_TIMEOUT_MS;

  // Collect internal links from a given page URL (returns array of hrefs)
  const collectLinks = async (pageUrl: string): Promise<string[]> => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout });
    return await page.evaluate((baseUrl) => {
      const base = new URL(baseUrl);
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const urls: string[] = [];
      for (const a of anchors) {
        try {
          const href = a.href;
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
          const url = new URL(href, base.href);
          // Same hostname, and strip fragment for dedup
          if (url.hostname === base.hostname) {
            const key = url.pathname + (url.search ? '?' + url.search : '');
            urls.push(url.href);
          }
        } catch { /* skip */ }
      }
      return [...new Set(urls)];
    }, baseUrl);
  };

  // Extract summary from current page
  const extractSummary = async (): Promise<PageSummary> => {
    return await page.evaluate(() => {
      const title = document.title || '';
      const h1s = Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim() || '');
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map((h) => h.textContent?.trim() || '').filter(Boolean);
      const metaDesc = (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content || '';
      const body = document.body;
      const clone = body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script, style, noscript, nav, footer, header, [role="banner"]').forEach((el) => el.remove());
      const bodyText = clone.textContent?.trim().slice(0, 2000) || '';
      return { title, h1: h1s.join('; '), headings, metaDescription: metaDesc, bodyText };
    });
  };

  // Seed links from homepage
  const seedLinks = await collectLinks(baseUrl);
  seedLinks.forEach((u) => allSeen.add(new URL(u).pathname + (new URL(u).search || '')));

  const queue: string[] = [...seedLinks]; // BFS queue
  const pages: PageSummary[] = [];

  // Crawl homepage first
  if (verbose) process.stderr.write(`    ${tf('crawling_page', { n: 1, url: baseUrl })}\n`);
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout });
    pages.push({ url: baseUrl, ...(await extractSummary()) });
    crawledUrls.add(baseUrl);
  } catch {
    if (verbose) process.stderr.write(`    ${t('crawl_failed')}\n`);
  }

  // BFS by depth level
  let depth = 1;
  let count = pages.length;

  while (queue.length > 0 && depth <= maxDepth && pages.length < maxPages) {
    if (verbose) process.stderr.write(`    ${tf('crawl_depth', { depth })}\n`);
    const levelSize = queue.length;
    for (let i = 0; i < levelSize && pages.length < maxPages; i++) {
      const link = queue.shift()!;
      if (crawledUrls.has(link)) continue;

      count++;
      if (verbose) process.stderr.write(`    ${tf('crawling_page', { n: count, url: link })}\n`);
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout });
        pages.push({ url: link, ...(await extractSummary()) });
        crawledUrls.add(link);

        // If we still have depth budget, collect links from this page
        if (depth < maxDepth) {
          const childLinks = await collectLinks(link);
          for (const cl of childLinks) {
            const key = new URL(cl).pathname + (new URL(cl).search || '');
            if (!allSeen.has(key)) {
              allSeen.add(key);
              queue.push(cl);
            }
          }
        }
      } catch {
        if (verbose) process.stderr.write(`    ${t('crawl_failed')}\n`);
      }
    }
    depth++;
  }

  // Navigate back to the original page
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout });
  } catch {
    // If we can't navigate back, the caller should handle this
  }

  return pages;
}

export interface IntentAnalysis {
  passed: boolean;
  coverage: Record<string, { covered: boolean; pageUrl?: string; reason: string }>;
  missingTypes: string[];
}

export function analyzeIntentCoverage(pages: PageSummary[]): IntentAnalysis {
  const intentTypes = {
    informational: {
      pattern: /^(what|how|why|when|where|who|is|are|can|does|should|guide|tutorial|introduction|overview|learn|about)/i,
      label: 'Informational (What/Why/How)',
    },
    howto: {
      pattern: /^(how to|steps|tutorial|guide|setup|install|configure|create|build|make|get started)/i,
      label: 'How-to / Tutorial',
    },
    comparison: {
      pattern: /(vs\.?|versus|alternative|compare|comparison|best |top |better than|instead of|similar to)/i,
      label: 'Comparison / Alternatives',
    },
    question: {
      pattern: /\b(what|how|why|when|where|who|which|does|is|are|can|should)\b.*\?/i,
      label: 'Q&A / FAQ',
    },
    commercial: {
      pattern: /(pricing|buy|plan|free|premium|subscription|enterprise|feature|service|product|solution)/i,
      label: 'Commercial / Transactional',
    },
  };

  const coverage: Record<string, { covered: boolean; pageUrl?: string; reason: string }> = {};

  for (const [type, { pattern, label }] of Object.entries(intentTypes)) {
    const matchingPage = pages.find((p) => {
      const allText = [p.title, p.h1, ...p.headings, p.metaDescription, p.bodyText].join(' ');
      return pattern.test(allText);
    });

    if (matchingPage) {
      coverage[type] = { covered: true, pageUrl: matchingPage.url, reason: `Found in "${matchingPage.title}"` };
    } else {
      coverage[type] = { covered: false, reason: `No page covers ${label.toLowerCase()} intent` };
    }
  }

  const missingTypes = Object.entries(coverage)
    .filter(([, v]) => !v.covered)
    .map(([k]) => k);

  // Pass if at least 2 of 5 intent types are covered
  const coveredCount = Object.values(coverage).filter((v) => v.covered).length;
  const passed = coveredCount >= 2;

  return { passed, coverage, missingTypes };
}

// 12.7: Check consistent entity naming across pages
export interface EntityConsistencyResult {
  passed: boolean;
  inconsistencies: { entity: string; variants: string[]; pages: string[] }[];
  details: string;
}

export function checkEntityConsistency(pages: PageSummary[]): EntityConsistencyResult {
  if (pages.length < 2) {
    return { passed: true, inconsistencies: [], details: 'Not enough pages to analyze entity consistency.' };
  }

  // Extract potential entity names from page titles and H1s
  // Entities are typically 2-4 word proper-noun-like phrases
  const extractEntities = (text: string): Set<string> => {
    const entities = new Set<string>();
    // Match title-case phrases (2-4 words) like "CloudCreate AI", "Geo Checklist"
    const titleCaseMatches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g);
    if (titleCaseMatches) {
      titleCaseMatches.forEach((e) => entities.add(e.trim()));
    }
    // Also match brand-like single words (capitalized, 3+ chars, not common words)
    const commonWords = new Set(['The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Which', 'Who', 'Why', 'How', 'About', 'Best', 'Good', 'Great', 'New', 'Old', 'Free', 'Top', 'Home', 'Blog', 'Page', 'Menu', 'Search', 'Login', 'Sign', 'Welcome', 'Introduction', 'Overview', 'Getting', 'Start', 'End', 'Next', 'Previous', 'More', 'Less', 'All', 'Some', 'Other', 'Another', 'Each', 'Every', 'Both', 'Few', 'Many', 'Much']);
    const singleWordMatches = text.match(/\b([A-Z][a-z]{3,})\b/g);
    if (singleWordMatches) {
      singleWordMatches.forEach((w) => {
        if (!commonWords.has(w)) entities.add(w);
      });
    }
    return entities;
  };

  // Collect all entities across all pages
  const pageEntities: { page: PageSummary; entities: string[] }[] = [];
  const allEntities = new Set<string>();
  for (const page of pages) {
    const entityText = [page.title, page.h1, ...page.headings.slice(0, 5)].join(' ');
    const entities = [...extractEntities(entityText)];
    pageEntities.push({ page, entities });
    entities.forEach((e) => allEntities.add(e));
  }

  // For entities that appear on multiple pages, check for naming variants
  // (e.g., "CloudCreate" vs "Cloud Create" vs "CloudCreate AI")
  const entityPages: Map<string, string[]> = new Map();
  for (const { page, entities } of pageEntities) {
    for (const entity of entities) {
      if (!entityPages.has(entity)) entityPages.set(entity, []);
      entityPages.get(entity)!.push(page.url);
    }
  }

  // Find potential inconsistencies — entities that share base words
  const normalizeEntity = (e: string) => e.toLowerCase().replace(/\s+/g, '');
  const entityGroups: Map<string, string[]> = new Map();
  for (const entity of allEntities) {
    const key = normalizeEntity(entity);
    if (!entityGroups.has(key)) entityGroups.set(key, []);
    entityGroups.get(key)!.push(entity);
  }

  const inconsistencies: { entity: string; variants: string[]; pages: string[] }[] = [];
  for (const [key, variants] of entityGroups) {
    if (variants.length > 1) {
      // Multiple variants of the same base entity name
      const allPages = variants.flatMap((v) => entityPages.get(v) || []);
      inconsistencies.push({ entity: key, variants: [...new Set(variants)], pages: [...new Set(allPages)] });
    }
  }

  // Also check if key brand entities (from domain) are mentioned consistently
  const domainEntity = pages[0] ? new URL(pages[0].url).hostname.replace(/^www\./, '').split('.')[0] : '';
  if (domainEntity) {
    const pagesMissingBrand = pages.filter((p) => {
      const allText = [p.title, p.h1, ...p.headings, p.metaDescription].join(' ').toLowerCase();
      return !allText.includes(domainEntity.toLowerCase()) && !allText.includes(domainEntity.toLowerCase().replace(/\s+/g, ''));
    });
    if (pagesMissingBrand.length > pages.length * 0.5) {
      inconsistencies.push({
        entity: domainEntity,
        variants: [domainEntity],
        pages: pagesMissingBrand.map((p) => p.url),
      });
    }
  }

  const passed = inconsistencies.length === 0;
  const details = passed
    ? 'Entity naming is consistent across all crawled pages.'
    : `Found ${inconsistencies.length} entity naming inconsistency(ies).`;

  return { passed, inconsistencies, details };
}

export interface DuplicateContentResult {
  passed: boolean;
  duplicates: { urlA: string; urlB: string; similarity: number }[];
}

// 3.3: Check for duplicate content across pages using Jaccard similarity
export function checkDuplicateContent(pages: PageSummary[], threshold = 0.8): DuplicateContentResult {
  // Filter out pages with very little content (< 50 words) to avoid false positives
  const meaningfulPages = pages.filter((p) => p.bodyText.trim().length > 100);
  if (meaningfulPages.length < 2) {
    return { passed: true, duplicates: [] };
  }

  // Normalize paths for comparison (strip trailing slash, lowercase)
  const normalizePath = (url: string) => new URL(url).pathname.replace(/\/$/, '').toLowerCase();

  // Deduplicate by normalized path — if two URLs have same normalized path, keep the longer one (more content)
  const pathMap = new Map<string, PageSummary>();
  for (const p of meaningfulPages) {
    const path = normalizePath(p.url);
    const existing = pathMap.get(path);
    if (!existing || p.bodyText.length > existing.bodyText.length) {
      pathMap.set(path, p);
    }
  }
  const dedupedPages = [...pathMap.values()];

  if (dedupedPages.length < 2) {
    return { passed: true, duplicates: [] };
  }

  // Extract word sets (lowercase, alphanumeric only)
  const wordSets = dedupedPages.map((p) => {
    const words = p.bodyText.toLowerCase().match(/[a-z0-9一-鿿]+/g) || [];
    // Remove common stop words
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'about', 'against', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);
    return new Set(words.filter((w) => !stopWords.has(w)));
  });

  const duplicates: { urlA: string; urlB: string; similarity: number }[] = [];

  for (let i = 0; i < dedupedPages.length; i++) {
    for (let j = i + 1; j < dedupedPages.length; j++) {
      const setA = wordSets[i];
      const setB = wordSets[j];
      const intersection = [...setA].filter((w) => setB.has(w));
      const union = new Set([...setA, ...setB]);
      const jaccard = intersection.length / union.size;

      if (jaccard >= threshold) {
        duplicates.push({
          urlA: dedupedPages[i].url,
          urlB: dedupedPages[j].url,
          similarity: Math.round(jaccard * 100),
        });
      }
    }
  }

  return { passed: duplicates.length === 0, duplicates };
}
