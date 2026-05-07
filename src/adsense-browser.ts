import type { Page } from 'playwright';
import { BROWSER_PAGE_TIMEOUT_MS } from './config';
import { crawlLocalPages } from './browser';
import type { PageSummary } from './browser';

// A.2: Template content ratio — check what percentage of page text is "main content"
export async function checkTemplateContentRatio(page: Page): Promise<{ passed: boolean; ratio: number; mainText: number; fullText: number; details: string }> {
  const ratio = await page.evaluate(() => {
    const bodyText = document.body.textContent?.replace(/\s+/g, ' ').trim() || '';
    const fullLength = bodyText.length;
    if (fullLength === 0) return { mainLength: 0, fullLength: 0 };

    // Try semantic main content selectors first
    const mainSelectors = [
      'main', 'article', '[role="main"]',
      '#content', '.content', '.post', '.entry', '.main-content',
      '#main', '.main', '.post-content', '.article-content',
      '.entry-content', '.post-body', '.article-body',
    ];

    let mainText = '';
    for (const selector of mainSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        mainText = el.textContent.replace(/\s+/g, ' ').trim();
        if (mainText.length > 50) break; // Found meaningful main content
      }
    }

    // Fallback: body minus common chrome elements
    if (mainText.length < 50) {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script, style, noscript, nav, footer, header, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').forEach((el) => el.remove());
      // Also remove elements with sidebar/ad-like classes
      clone.querySelectorAll('.sidebar, .widget, .ad, .banner, .menu, [class*="sidebar"], [class*="widget"], [class*="advertisement"], [class*="ad-slot"]').forEach((el) => el.remove());
      mainText = clone.textContent?.replace(/\s+/g, ' ').trim() || '';
    }

    return { mainLength: mainText.length, fullLength };
  });

  const ratioValue = ratio.fullLength > 0 ? ratio.mainLength / ratio.fullLength : 0;
  const ratioPercent = Math.round(ratioValue * 100);
  const passed = ratioValue >= 0.40;

  return {
    passed,
    ratio: ratioValue,
    mainText: ratio.mainLength,
    fullText: ratio.fullLength,
    details: `Main content: ${ratio.mainLength} chars, full page: ${ratio.fullLength} chars, ratio: ${ratioPercent}%. ${passed ? 'Content ratio is sufficient.' : 'Too much template/navigation content relative to main content.'}`,
  };
}

// A.3: Content originality — crawl sibling pages and compute average pairwise similarity
export async function checkContentOriginality(
  page: Page,
  baseUrl: string,
  maxPages: number = 10,
  maxDepth: number = 1,
  verbose = false,
  pageTimeout?: number,
): Promise<{ passed: boolean; avgSimilarity: number; details: string }> {
  const pages = await crawlLocalPages(page, baseUrl, maxPages, verbose, maxDepth, pageTimeout);

  if (pages.length < 2) {
    return { passed: true, avgSimilarity: 0, details: `Only ${pages.length} page(s) crawled — not enough for originality analysis.` };
  }

  // Extract word sets (same approach as checkDuplicateContent)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'about', 'against', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);

  const wordSets = pages.map((p) => {
    const words = p.bodyText.toLowerCase().match(/[a-z0-9一-鿿]+/g) || [];
    return new Set(words.filter((w) => !stopWords.has(w)));
  });

  let totalSimilarity = 0;
  let pairCount = 0;
  let highSimilarityPairs = 0;

  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const setA = wordSets[i];
      const setB = wordSets[j];
      if (setA.size === 0 || setB.size === 0) continue;
      const intersection = [...setA].filter((w) => setB.has(w));
      const union = new Set([...setA, ...setB]);
      const jaccard = intersection.length / union.size;
      totalSimilarity += jaccard;
      pairCount++;
      if (jaccard > 0.6) highSimilarityPairs++;
    }
  }

  const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
  const avgPercent = Math.round(avgSimilarity * 100);
  const passed = avgSimilarity < 0.60;

  return {
    passed,
    avgSimilarity,
    details: `Crawled ${pages.length} pages, ${pairCount} pairwise comparisons. Average similarity: ${avgPercent}%. High-similarity (>60%) pairs: ${highSimilarityPairs}. ${passed ? 'Content appears original.' : 'High average similarity — pages may be template-reliant.'}`,
  };
}

// A.7: Cookie/privacy consent mechanism detection
export async function checkConsentMechanism(page: Page): Promise<{ passed: boolean; details: string }> {
  const consentInfo = await page.evaluate(() => {
    // Check by selectors
    const consentSelectors = [
      '[id*="consent"]', '[id*="cookie"]', '[class*="cookie"]',
      '[class*="gdpr"]', '[class*="consent"]', '[aria-label*="consent"]',
      '[aria-label*="cookie"]', '[data-consent]', '[data-cookie]',
      '#cookie-banner', '.cookie-banner', '#cookie-consent', '.cookie-consent',
      '.cc-banner', '.osano-cp-info', '.onetrust-banner',
    ];

    let foundBySelector = false;
    for (const selector of consentSelectors) {
      if (document.querySelector(selector)) {
        foundBySelector = true;
        break;
      }
    }

    // Check by text patterns
    const bodyText = document.body.textContent?.toLowerCase() || '';
    const consentPatterns = [
      /cookie.*consent/i,
      /we use cookies/i,
      /accept all.*cookie/i,
      /manage.*preference/i,
      /privacy choices/i,
      /this website uses cookies/i,
      /by continuing to.*accept/i,
      /agree.*cookie/i,
    ];

    const foundByText = consentPatterns.some((p) => p.test(bodyText));

    return { foundBySelector, foundByText };
  });

  const passed = consentInfo.foundBySelector || consentInfo.foundByText;

  if (passed) {
    return { passed: true, details: 'Cookie/privacy consent mechanism detected.' };
  }
  return { passed: false, details: 'No cookie/privacy consent mechanism found.', recommendation: 'Add a cookie consent banner (required for GDPR compliance in EU).' };
}

// A.9: Directory-level similarity analysis — crawls site broadly, groups by path segment, analyzes per-group similarity
export interface DirectoryGroupAnalysis {
  directory: string;
  pageCount: number;
  avgSimilarity: number;
  highSimilarityPairs: number;
  totalPairs: number;
  passed: boolean;
}

export async function analyzeDirectorySimilarity(
  page: Page,
  baseUrl: string,
  maxPages: number = 50,
  verbose = false,
  pageTimeout?: number,
): Promise<{ directories: DirectoryGroupAnalysis[]; overallPassed: boolean }> {
  // Broader crawl: start from homepage, go deeper
  const base = new URL(baseUrl);
  const homeUrl = `${base.protocol}//${base.host}/`;
  const timeout = pageTimeout ?? BROWSER_PAGE_TIMEOUT_MS;

  // BFS crawl with higher depth
  const visited = new Map<string, PageSummary>();

  // Navigate to homepage
  if (verbose) process.stderr.write(`    [site-wide] Starting from ${homeUrl}\n`);
  try {
    await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout });
    visited.set(homeUrl, await extractPageSummary(page));
  } catch {
    // If homepage fails, try the original URL
    try {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout });
      visited.set(baseUrl, await extractPageSummary(page));
    } catch {
      return { directories: [], overallPassed: false };
    }
  }

  // Seed: collect links from homepage for depth 1
  const collectLinksFrom = async (url: string): Promise<string[]> => {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch {
      return [];
    }
    return await page.evaluate((baseHost: string) => {
      const base = new URL(window.location.href);
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const urls: string[] = [];
      for (const a of anchors) {
        try {
          const href = a.href;
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
          const url = new URL(href);
          if (url.host === baseHost && url.pathname !== base.pathname) {
            urls.push(url.origin + url.pathname);
          }
        } catch { /* skip */ }
      }
      return [...new Set(urls)];
    }, base.host);
  };

  const seen = new Set<string>(visited.keys());
  let levelLinks = await collectLinksFrom(homeUrl);

  const maxDepth = 2;
  for (let depth = 1; depth <= maxDepth && visited.size < maxPages && levelLinks.length > 0; depth++) {
    if (verbose) process.stderr.write(`    [site-wide] Depth ${depth}, pages: ${levelLinks.length}, total crawled: ${visited.size}\n`);
    const nextLevel: string[] = [];

    for (const link of levelLinks) {
      if (visited.size >= maxPages) break;
      if (seen.has(link)) continue;

      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
        visited.set(link, await extractPageSummary(page));
        seen.add(link);

        // Collect child links for next depth — do NOT add to seen yet
        if (depth < maxDepth) {
          const childLinks = await collectLinksFrom(link);
          for (const cl of childLinks) {
            if (!seen.has(cl) && !visited.has(cl)) {
              nextLevel.push(cl);
            }
          }
        }
      } catch {
        seen.add(link);
      }
    }

    // Deduplicate nextLevel
    levelLinks = [...new Set(nextLevel)];
  }

  // Navigate back
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout });
  } catch { /* ignore */ }

  // Group by directory (first path segment)
  const groupByUrl = (url: string): string => {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    return parts.length > 0 ? parts[0] : 'homepage';
  };

  const groups: Map<string, PageSummary[]> = new Map();
  for (const [url, summary] of visited) {
    const dir = groupByUrl(url);
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir)!.push(summary);
  }

  // Analyze each group
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'about', 'against', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom']);

  const wordSets = (pages: PageSummary[]) => pages.map((p) => {
    const words = p.bodyText.toLowerCase().match(/[a-z0-9一-鿿]+/g) || [];
    return new Set(words.filter((w) => !stopWords.has(w)));
  });

  const computeAvgSimilarity = (wsets: Set<string>[]): { avg: number; highPairs: number; total: number } => {
    let totalSim = 0;
    let pairCount = 0;
    let highPairs = 0;
    for (let i = 0; i < wsets.length; i++) {
      for (let j = i + 1; j < wsets.length; j++) {
        const setA = wsets[i];
        const setB = wsets[j];
        if (setA.size === 0 || setB.size === 0) continue;
        const intersection = [...setA].filter((w) => setB.has(w));
        const union = new Set([...setA, ...setB]);
        const jaccard = intersection.length / union.size;
        totalSim += jaccard;
        pairCount++;
        if (jaccard > 0.6) highPairs++;
      }
    }
    return { avg: pairCount > 0 ? totalSim / pairCount : 0, highPairs, total: pairCount };
  };

  const directories: DirectoryGroupAnalysis[] = [];
  for (const [dir, pages] of groups) {
    if (pages.length < 2) continue; // Skip directories with only 1 page
    const wsets = wordSets(pages);
    const { avg, highPairs, total } = computeAvgSimilarity(wsets);
    directories.push({
      directory: dir,
      pageCount: pages.length,
      avgSimilarity: Math.round(avg * 100),
      highSimilarityPairs: highPairs,
      totalPairs: total,
      passed: avg < 0.60,
    });
  }

  // Sort by similarity descending (worst first)
  directories.sort((a, b) => b.avgSimilarity - a.avgSimilarity);

  const overallPassed = directories.every((d) => d.passed);
  return { directories, overallPassed };
}

async function extractPageSummary(page: Page): Promise<PageSummary> {
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
}
