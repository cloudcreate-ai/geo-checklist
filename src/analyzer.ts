import type { Page } from 'playwright';
import { parseHtml } from './utils/parse-html';
import { fetchPage, fetchRobotsTxt, fetchSitemap } from './fetcher';
import { launchBrowser, closeBrowser, loadPage } from './browser';
import type { AuditContext, AuditReport, CheckResult } from './types';
import { allChecks } from './checks';
import { buildReport } from './report';
import { t, tf, intentTypesLabel } from './i18n';

function log(msg: string): void {
  process.stderr.write(`\x1b[36m[AUDIT]\x1b[0m ${msg}\n`);
}

function dot(msg: string): void {
  process.stderr.write(`  \x1b[33m→\x1b[0m ${msg}\n`);
}

export async function runAudit(url: string, verbose = true, crawlOpts?: { maxPages?: number; maxDepth?: number }, fast = false): Promise<AuditReport> {
  if (verbose) log(tf('audit_start', { url }));

  dot(t('fetching_html'));
  const fetchResult = await fetchPage(url);
  if (verbose) dot(tf('page_fetched', { status: fetchResult.status, loadTimeMs: fetchResult.loadTimeMs }));

  dot(t('fetching_robots'));
  const robotsTxt = await fetchRobotsTxt(url);
  if (verbose) dot(robotsTxt ? t('robots_found') : t('robots_not_found'));

  dot(t('fetching_sitemap'));
  const sitemapXml = await fetchSitemap(url);
  if (verbose) dot(sitemapXml ? t('sitemap_found') : t('sitemap_not_found'));

  const doc = parseHtml(fetchResult.html);

  // Try browser rendering for JS-heavy pages (skip in fast mode)
  let browserHtml: string | undefined;
  let browserUrl: string | undefined;
  let browserCtx: { browser: import('playwright').Browser; page: import('playwright').Page } | undefined;

  if (!fast) {
    if (verbose) log(t('launching_browser'));
    try {
      browserCtx = await launchBrowser();
      if (verbose) dot(t('loading_page'));
      await loadPage(browserCtx.page, url);
      browserHtml = await browserCtx.page.content();
      browserUrl = browserCtx.page.url();
      if (verbose) dot(tf('browser_rendered', { url: browserUrl }));
    } catch {
      if (verbose) dot(t('browser_failed'));
    }
  } else if (verbose) {
    dot(t('fast_skipped'));
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

  if (verbose) log(tf('running_static_checks', { count: allChecks.length }));
  const results: CheckResult[] = allChecks.map((check) => check.execute(ctx));

  // Run browser-based checks that need the page object directly
  if (browserCtx?.page) {
    if (verbose) log(t('running_browser_checks'));
    await runBrowserChecks(ctx, browserCtx.page, results, verbose, crawlOpts);
    if (verbose) dot(t('closing_browser'));
    await closeBrowser(browserCtx);
  }

  if (verbose) log(t('generating_report'));
  return buildReport(ctx, results);
}

/**
 * Replace placeholder results from stubbed checks with real browser-based results.
 * We mutate the results array in place for checks that required browser capabilities.
 */
async function runBrowserChecks(
  ctx: AuditContext,
  page: Page,
  results: CheckResult[],
  verbose: boolean,
  crawlOpts?: { maxPages?: number; maxDepth?: number },
): Promise<void> {
  const { checkLinks, check404Page, testMobileResponsive, detectInterstitials, detectCaptcha, extractDates, crawlLocalPages, analyzeIntentCoverage } = await import('./browser');

  const url = ctx.browserUrl || ctx.finalUrl;

  for (const result of results) {
    switch (result.id) {
      case '5.2': {
        if (verbose) dot(t('check_52_links'));
        const linkResults = await checkLinks(page, url);
        if (verbose) {
          dot(linkResults.broken.length > 0
            ? tf('check_52_broken', { count: linkResults.broken.length })
            : t('check_52_ok')
          );
        }
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
        if (verbose) dot(t('check_53_redirects'));
        const linkResults = await checkLinks(page, url);
        if (verbose) {
          dot(linkResults.redirectChains.length > 0
            ? tf('check_53_found', { count: linkResults.redirectChains.length })
            : t('check_53_ok')
          );
        }
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
        if (verbose) dot(t('check_63_mobile'));
        const mobileResult = await testMobileResponsive(page, url);
        result.passed = mobileResult.passed;
        result.details = mobileResult.details;
        result.recommendation = mobileResult.recommendation;
        break;
      }
      case '6.4': {
        if (verbose) dot(t('check_64_overlay'));
        const interstitialResult = await detectInterstitials(page, url);
        result.passed = interstitialResult.passed;
        result.details = interstitialResult.details;
        result.recommendation = interstitialResult.recommendation;
        break;
      }
      case '6.6': {
        if (verbose) dot(t('check_66_404'));
        const notFoundResult = await check404Page(page, url);
        result.passed = notFoundResult.passed;
        result.details = notFoundResult.details;
        result.recommendation = notFoundResult.recommendation;
        break;
      }
      case '11.3': {
        if (verbose) dot(t('check_113_captcha'));
        const captchaResult = await detectCaptcha(page, url);
        result.passed = captchaResult.passed;
        result.details = captchaResult.details;
        break;
      }
      case '3.4': {
        if (verbose) dot(t('check_34_dates'));
        const dateResult = await extractDates(page);
        result.passed = dateResult.passed;
        result.details = dateResult.details;
        break;
      }
      case '3.2': {
        if (verbose) dot(t('check_32_crawling'));
        const maxPages = crawlOpts?.maxPages ?? 20;
        const maxDepth = crawlOpts?.maxDepth ?? 1;
        const localPages = await crawlLocalPages(page, url, maxPages, verbose, maxDepth);
        if (verbose) dot(tf('check_32_crawled', { count: localPages.length }));
        const intent = analyzeIntentCoverage(localPages);
        result.passed = intent.passed;
        const coveredCount = Object.values(intent.coverage).filter((v) => v.covered).length;
        const totalTypes = Object.keys(intent.coverage).length;
        const detailsParts = Object.entries(intent.coverage).map(([type, v]) => {
          const label = intentTypesLabel[type] || type;
          return v.covered ? `${label}: ✅` : `${label}: ❌`;
        });
        result.details = tf('intent_coverage', {
          covered: coveredCount,
          total: totalTypes,
          details: detailsParts.join(' | '),
        });
        if (intent.missingTypes.length > 0) {
          const missingLabels = intent.missingTypes.map((t2) => intentTypesLabel[t2] || t2);
          result.recommendation = tf('intent_missing', { types: missingLabels.join(', ') });
        }
        break;
      }
    }
  }
}
