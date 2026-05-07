import type { Page } from 'playwright';
import { parseHtml } from './utils/parse-html';
import { fetchPage, fetchRobotsTxt, fetchSitemap } from './fetcher';
import { launchBrowser, closeBrowser, loadPage } from './browser';
import type { AuditContext, AuditReport, CheckResult } from './types';
import { allChecks } from './checks';
import { buildReport } from './report';

function log(msg: string): void {
  process.stderr.write(`\x1b[36m[AUDIT]\x1b[0m ${msg}\n`);
}

function dot(msg: string): void {
  process.stderr.write(`  \x1b[33m→\x1b[0m ${msg}\n`);
}

export async function runAudit(url: string, verbose = true): Promise<AuditReport> {
  if (verbose) log(`开始审计 ${url}`);

  dot('抓取页面 HTML...');
  const fetchResult = await fetchPage(url);
  if (verbose) dot(`页面已抓取 (HTTP ${fetchResult.status}, ${fetchResult.loadTimeMs}ms)`);

  dot('获取 robots.txt...');
  const robotsTxt = await fetchRobotsTxt(url);
  if (verbose) dot(`robots.txt ${robotsTxt ? '已找到' : '未找到'}`);

  dot('获取 sitemap...');
  const sitemapXml = await fetchSitemap(url);
  if (verbose) dot(`sitemap ${sitemapXml ? '已找到' : '未找到'}`);

  const doc = parseHtml(fetchResult.html);

  // Try browser rendering for JS-heavy pages
  let browserHtml: string | undefined;
  let browserUrl: string | undefined;
  let browserCtx: { browser: import('playwright').Browser; page: import('playwright').Page } | undefined;

  if (verbose) log('启动浏览器 (Chromium)...');
  try {
    browserCtx = await launchBrowser();
    if (verbose) dot('页面加载中...');
    await loadPage(browserCtx.page, url);
    browserHtml = await browserCtx.page.content();
    browserUrl = browserCtx.page.url();
    if (verbose) dot(`浏览器页面已渲染: ${browserUrl}`);
  } catch {
    if (verbose) dot('浏览器渲染失败，使用静态 HTML');
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

  if (verbose) log(`运行 ${allChecks.length} 项静态检查...`);
  const results: CheckResult[] = allChecks.map((check) => check.execute(ctx));

  // Run browser-based checks that need the page object directly
  if (browserCtx?.page) {
    if (verbose) log('运行浏览器检查...');
    await runBrowserChecks(ctx, browserCtx.page, results, verbose);
    if (verbose) dot('关闭浏览器');
    await closeBrowser(browserCtx);
  }

  if (verbose) log('生成报告...');
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
        if (verbose) dot('[5.2] 检查内部链接是否损坏...');
        const linkResults = await checkLinks(page, url);
        if (verbose) {
          if (linkResults.broken.length > 0) {
            dot(`发现 ${linkResults.broken.length} 个损坏链接`);
          } else {
            dot('无损坏链接');
          }
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
        if (verbose) dot('[5.3] 检查链接重定向链...');
        const linkResults = await checkLinks(page, url);
        if (verbose) {
          if (linkResults.redirectChains.length > 0) {
            dot(`发现 ${linkResults.redirectChains.length} 条重定向链`);
          } else {
            dot('无重定向链');
          }
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
        if (verbose) dot('[6.3] 测试移动端响应式布局...');
        const mobileResult = await testMobileResponsive(page, url);
        result.passed = mobileResult.passed;
        result.details = mobileResult.details;
        result.recommendation = mobileResult.recommendation;
        break;
      }
      case '6.4': {
        if (verbose) dot('[6.4] 检测弹窗/遮罩层...');
        const interstitialResult = await detectInterstitials(page, url);
        result.passed = interstitialResult.passed;
        result.details = interstitialResult.details;
        result.recommendation = interstitialResult.recommendation;
        break;
      }
      case '6.6': {
        if (verbose) dot('[6.6] 测试 404 页面...');
        const notFoundResult = await check404Page(page, url);
        result.passed = notFoundResult.passed;
        result.details = notFoundResult.details;
        result.recommendation = notFoundResult.recommendation;
        break;
      }
      case '11.3': {
        if (verbose) dot('[11.3] 检测 CAPTCHA/机器人验证...');
        const captchaResult = await detectCaptcha(page, url);
        result.passed = captchaResult.passed;
        result.details = captchaResult.details;
        break;
      }
      case '3.4': {
        if (verbose) dot('[3.4] 提取页面日期（内容时效性）...');
        const dateResult = await extractDates(page);
        result.passed = dateResult.passed;
        result.details = dateResult.details;
        break;
      }
      case '3.2': {
        if (verbose) dot('[3.2] 爬取内部页面，分析内容意图...');
        const localPages = await crawlLocalPages(page, url, 20, verbose);
        if (verbose) dot(`已爬取 ${localPages.length} 个内部页面`);
        const intent = analyzeIntentCoverage(localPages);
        result.passed = intent.passed;
        const coveredCount = Object.values(intent.coverage).filter((v) => v.covered).length;
        const totalTypes = Object.keys(intent.coverage).length;
        const detailsParts = Object.entries(intent.coverage).map(([type, v]) => {
          const label = intentTypesLabel[type] || type;
          return v.covered ? `${label}: ✅` : `${label}: ❌`;
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
