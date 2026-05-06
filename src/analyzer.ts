import { parseHtml } from './utils/parse-html';
import { fetchPage, fetchRobotsTxt, fetchSitemap } from './fetcher';
import type { AuditContext, AuditReport, CheckResult } from './types';
import { allChecks } from './checks';
import { buildReport } from './report';

export async function runAudit(url: string): Promise<AuditReport> {
  const fetchResult = await fetchPage(url);
  const robotsTxt = await fetchRobotsTxt(url);
  const sitemapXml = await fetchSitemap(url);

  const doc = parseHtml(fetchResult.html);

  const ctx: AuditContext = {
    url: new URL(url),
    html: fetchResult.html,
    doc,
    status: fetchResult.status,
    headers: fetchResult.headers,
    loadTimeMs: fetchResult.loadTimeMs,
    finalUrl: fetchResult.finalUrl,
    robotsTxt,
    sitemapXml,
  };

  const results: CheckResult[] = allChecks.map((check) => check.execute(ctx));
  return buildReport(ctx, results);
}
