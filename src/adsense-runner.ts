import { fetchPage } from './fetcher';
import { parseHtml } from './utils/parse-html';
import { launchBrowser, closeBrowser } from './browser';
import type { AuditContext, CheckResult } from './types';
import { adsenseChecks } from './adsense-checks';
import { buildAdsenseReport, printMarkdown, type AdsenseAuditReport } from './adsense-report';
import { t, tf } from './i18n';

function log(msg: string): void {
  process.stderr.write(`\x1b[35m[ADSENSE]\x1b[0m ${msg}\n`);
}

function dot(msg: string): void {
  process.stderr.write(`  \x1b[33m→\x1b[0m ${msg}\n`);
}

export async function runAdsenseAudit(
  url: string,
  verbose = true,
  crawlOpts?: { maxPages?: number; maxDepth?: number; pageTimeout?: number },
): Promise<AdsenseAuditReport> {
  if (verbose) log(tf('adsense_audit_start', { url }));

  dot(t('fetching_html'));
  const fetchResult = await fetchPage(url);
  if (verbose) dot(tf('page_fetched', { status: fetchResult.status, loadTimeMs: fetchResult.loadTimeMs }));

  const doc = parseHtml(fetchResult.html);

  // Try browser rendering
  let browserHtml: string | undefined;
  let browserUrl: string | undefined;
  let browserCtx: { browser: import('playwright').Browser; page: import('playwright').Page } | undefined;

  const pageTimeout = crawlOpts?.pageTimeout;
  if (verbose) log(t('launching_browser'));
  try {
    browserCtx = await launchBrowser();
    if (verbose) dot(t('loading_page'));
    await browserCtx.page.goto(url, { waitUntil: 'domcontentloaded', timeout: pageTimeout ?? 30000 });
    browserHtml = await browserCtx.page.content();
    browserUrl = browserCtx.page.url();
    if (verbose) dot(tf('browser_rendered', { url: browserUrl }));
  } catch {
    if (verbose) dot(t('browser_failed'));
    if (browserCtx) await closeBrowser(browserCtx);
    browserCtx = undefined;
  }

  const ctx: AuditContext = {
    url: new URL(url),
    html: browserHtml ?? fetchResult.html,
    doc: browserHtml ? parseHtml(browserHtml) : doc,
    status: fetchResult.status,
    headers: fetchResult.headers,
    loadTimeMs: fetchResult.loadTimeMs,
    finalUrl: fetchResult.finalUrl,
    browserHtml,
    browserUrl,
  };

  if (verbose) log(tf('adsense_running_checks', { count: adsenseChecks.length }));
  const results: CheckResult[] = adsenseChecks.map((check) => check.execute(ctx));

  // Run AdSense browser checks
  if (browserCtx?.page) {
    if (verbose) log(t('adsense_running_browser'));
    await runAdsenseBrowserChecks(ctx, browserCtx.page, results, verbose, crawlOpts);
    if (verbose) dot(t('closing_browser'));
    await closeBrowser(browserCtx);
  }

  if (verbose) log(t('adsense_generating_report'));
  return buildAdsenseReport(results, { loadTimeMs: ctx.loadTimeMs, statusCode: ctx.status, finalUrl: ctx.finalUrl });
}

async function runAdsenseBrowserChecks(
  ctx: AuditContext,
  page: import('playwright').Page,
  results: CheckResult[],
  verbose: boolean,
  crawlOpts?: { maxPages?: number; maxDepth?: number; pageTimeout?: number },
): Promise<void> {
  const { checkTemplateContentRatio, checkContentOriginality, checkConsentMechanism, analyzeDirectorySimilarity } = await import('./adsense-browser');

  const url = ctx.browserUrl || ctx.finalUrl;

  for (const result of results) {
    switch (result.id) {
      case 'A.2': {
        if (verbose) dot(t('adsense_check_a2'));
        const ratioResult = await checkTemplateContentRatio(page);
        result.passed = ratioResult.passed;
        result.value = Math.round(ratioResult.ratio * 100);
        result.details = ratioResult.details;
        if (!ratioResult.passed) {
          result.recommendation = 'Increase unique main content relative to template/sidebar/footer text.';
        }
        break;
      }
      case 'A.3': {
        if (verbose) dot(t('adsense_check_a3'));
        const maxPages = crawlOpts?.maxPages ?? 10;
        const maxDepth = crawlOpts?.maxDepth ?? 1;
        const originalityResult = await checkContentOriginality(page, url, maxPages, maxDepth, verbose, crawlOpts?.pageTimeout);
        result.passed = originalityResult.passed;
        result.value = Math.round(originalityResult.avgSimilarity * 100);
        result.details = originalityResult.details;
        if (!originalityResult.passed) {
          result.recommendation = 'Add more unique content to each page to reduce template reliance.';
        }
        break;
      }
      case 'A.7': {
        if (verbose) dot(t('adsense_check_a7'));
        const consentResult = await checkConsentMechanism(page);
        result.passed = consentResult.passed;
        result.details = consentResult.details;
        if (consentResult.recommendation) result.recommendation = consentResult.recommendation;
        break;
      }
      case 'A.9': {
        if (verbose) dot(t('adsense_check_a9'));
        // Site-wide crawl uses independent maxPages default (not the A.3 intent analysis default)
        const siteMaxPages = Math.max(crawlOpts?.maxPages ?? 10, 50);
        const dirResult = await analyzeDirectorySimilarity(page, url, siteMaxPages, verbose, crawlOpts?.pageTimeout);
        result.passed = dirResult.overallPassed;
        const failedDirs = dirResult.directories.filter((d) => !d.passed);
        if (failedDirs.length > 0) {
          const details = failedDirs.map((d) => `/${d.directory}/ — ${d.avgSimilarity}% avg similarity (${d.highSimilarityPairs}/${d.totalPairs} pairs across ${d.pageCount} pages)`).join('; ');
          result.details = `Site-wide crawl: ${dirResult.directories.length} directories analyzed. Failed: ${details}`;
          result.recommendation = 'Add unique content to template-heavy pages or use canonical tags.';
        } else {
          const summary = dirResult.directories.map((d) => `${d.directory}: ${d.pageCount} pages, ${d.avgSimilarity}% avg`).join('; ');
          result.details = `All directories pass. ${summary}`;
        }
        break;
      }
    }
  }
}

export { printMarkdown };
export type { AdsenseAuditReport };
