import { parseHtml } from './utils/parse-html';
import { fetchPage, fetchRobotsTxt, fetchSitemap } from './fetcher';
import { launchBrowser, closeBrowser, loadPage } from './browser';
import type { AuditContext, AuditReport, CheckResult } from './types';
import { allChecks } from './checks';
import { buildReport } from './report';

export async function runAudit(url: string): Promise<AuditReport> {
  const fetchResult = await fetchPage(url);
  const robotsTxt = await fetchRobotsTxt(url);
  const sitemapXml = await fetchSitemap(url);

  const doc = parseHtml(fetchResult.html);

  // Try browser rendering for JS-heavy pages
  let browserHtml: string | undefined;
  let browserUrl: string | undefined;
  let browserCtx: { browser: import('playwright').Browser; page: import('playwright').Page } | undefined;

  try {
    browserCtx = await launchBrowser();
    await loadPage(browserCtx.page, url);
    browserHtml = await browserCtx.page.content();
    browserUrl = browserCtx.page.url();
  } catch {
    // Browser failed — fall back to static HTML
  }

  const ctx: AuditContext = {
    url: new URL(url),
    html: browserHtml ?? fetchResult.html,
    doc: browserHtml ? parseHtml(browserHtml) : doc,
    status: fetchResult.status,
    headers: fetchResult.headers,
    loadTimeMs: fetchResult.loadTimeMs,
    finalUrl: fetchResult.finalUrl,
    robotsTxt,
    sitemapXml,
    browserHtml,
    browserUrl,
  };

  const results: CheckResult[] = allChecks.map((check) => {
    // Inject browser context for checks that need it
    return check.execute(ctx);
  });

  // Run browser-based checks that need the page object directly
  if (browserCtx?.page) {
    await runBrowserChecks(ctx, browserCtx.page, results);
    await closeBrowser(browserCtx);
  }

  return buildReport(ctx, results);
}

/**
 * Replace placeholder results from stubbed checks with real browser-based results.
 * We mutate the results array in place for checks that required browser capabilities.
 */
async function runBrowserChecks(
  ctx: AuditContext,
  page: import('playwright').Page,
  results: CheckResult[],
): Promise<void> {
  const { checkLinks, check404Page, testMobileResponsive, detectInterstitials, detectCaptcha, extractDates, crawlLocalPages, analyzeIntentCoverage } = await import('./browser');

  const intentTypesLabel: Record<string, string> = {
    informational: '信息型',
    howto: '操作型',
    comparison: '比较型',
    question: '问答型',
    commercial: '商业/交易',
  };

  const url = ctx.browserUrl || ctx.finalUrl;

  for (const result of results) {
    switch (result.id) {
      case '5.2': {
        // No broken links — run link check
        const linkResults = await checkLinks(page, url);
        if (linkResults.broken.length === 0) {
          result.passed = true;
          result.details = 'No broken links found among internal links.';
        } else {
          result.passed = false;
          result.details = `${linkResults.broken.length} broken link(s) found: ${linkResults.broken.slice(0, 5).map((b) => `${b.url} (${b.status})`).join(', ')}`;
          result.recommendation = 'Fix or remove broken links.';
        }
        break;
      }
      case '5.3': {
        // No redirect chains
        const linkResults = await checkLinks(page, url);
        if (linkResults.redirectChains.length === 0) {
          result.passed = true;
          result.details = 'No redirect chains found.';
        } else {
          result.passed = false;
          result.details = `${linkResults.redirectChains.length} redirect chain(s) found.`;
          result.recommendation = 'Remove redirect chains by linking directly to final URLs.';
        }
        break;
      }
      case '6.3': {
        // Mobile-responsive
        const mobileResult = await testMobileResponsive(page, url);
        result.passed = mobileResult.passed;
        result.details = mobileResult.details;
        result.recommendation = mobileResult.recommendation;
        break;
      }
      case '6.4': {
        // No interstitials
        const interstitialResult = await detectInterstitials(page, url);
        result.passed = interstitialResult.passed;
        result.details = interstitialResult.details;
        result.recommendation = interstitialResult.recommendation;
        break;
      }
      case '6.6': {
        // 404 page exists
        const notFoundResult = await check404Page(page, url);
        result.passed = notFoundResult.passed;
        result.details = notFoundResult.details;
        result.recommendation = notFoundResult.recommendation;
        break;
      }
      case '11.3': {
        // No CAPTCHA
        const captchaResult = await detectCaptcha(page, url);
        result.passed = captchaResult.passed;
        result.details = captchaResult.details;
        break;
      }
      case '3.4': {
        // Content freshness
        const dateResult = await extractDates(page);
        result.passed = dateResult.passed;
        result.details = dateResult.details;
        break;
      }
      case '3.2': {
        // Content intent coverage — crawl local pages
        const localPages = await crawlLocalPages(page, url);
        const intent = analyzeIntentCoverage(localPages);
        result.passed = intent.passed;
        const coveredCount = Object.values(intent.coverage).filter((v) => v.covered).length;
        const totalTypes = Object.keys(intent.coverage).length;
        const detailsParts = Object.entries(intent.coverage).map(([type, v]) => {
          const label = intentTypesLabel[type] || type;
          return v.covered ? `${label}: ✓` : `${label}: ✗`;
        });
        result.details = `${coveredCount}/${totalTypes} 意图类型覆盖: ${detailsParts.join(' | ')}`;
        if (intent.missingTypes.length > 0) {
          const missingLabels = intent.missingTypes.map((t) => intentTypesLabel[t] || t);
          result.recommendation = `缺少内容类型: ${missingLabels.join(', ')}`;
        }
        break;
      }
    }
  }
}
