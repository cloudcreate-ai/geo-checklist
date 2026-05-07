import type { CheerioAPI } from 'cheerio';

export type Severity = 'critical' | 'warning' | 'info';

export interface CheckResult {
  id: string;
  category: string;
  title: string;
  severity: Severity;
  passed: boolean;
  details: string;
  value?: string | number;
  recommendation?: string;
}

export interface CheckDefinition {
  id: string;
  title: string;
  severity: Severity;
  execute: (ctx: AuditContext) => CheckResult;
}

export interface AuditContext {
  url: URL;
  html: string;
  doc: CheerioAPI;
  status: number;
  headers: Record<string, string | string[]>;
  loadTimeMs: number;
  finalUrl: string;
  robotsTxt?: string;
  sitemapXml?: string;
  /** Browser-rendered HTML (after JS execution) */
  browserHtml?: string;
  /** Playwright page URL (may differ from finalUrl after redirects) */
  browserUrl?: string;
}

export interface AuditReport {
  url: string;
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  checks: CheckResult[];
  metadata: {
    loadTimeMs: number;
    statusCode: number;
    finalUrl: string;
  };
}
