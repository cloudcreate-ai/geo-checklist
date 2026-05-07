import type { CheckResult } from './types';
import { t, tf } from './i18n';

export interface AdsenseAuditReport {
  url: string;
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  score: number;
  gateChecksPassed: boolean;
  checks: CheckResult[];
  metadata: { loadTimeMs: number; statusCode: number; finalUrl: string };
}

export function buildAdsenseReport(checks: CheckResult[], metadata: { loadTimeMs: number; statusCode: number; finalUrl: string }): AdsenseAuditReport {
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed && c.severity !== 'info').length;
  const warnings = checks.filter((c) => !c.passed && c.severity === 'info').length;
  const score = Math.round((passed / checks.length) * 100);

  // Gate checks: A.1, A.2, A.4
  const gateIds = ['A.1', 'A.2', 'A.4'];
  const gateChecks = checks.filter((c) => gateIds.includes(c.id));
  const gateChecksPassed = gateChecks.every((c) => c.passed);

  return {
    url: metadata.finalUrl,
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passed, failed, warnings, score,
    gateChecksPassed,
    checks,
    metadata,
  };
}

export function printMarkdown(report: AdsenseAuditReport): string {
  const lines: string[] = [];
  lines.push(`# ${t('adsense_report_title')}`);
  lines.push('');
  lines.push(`| ${t('report_url')} | ${report.url} |`);
  lines.push(`| ${t('report_time')} | ${report.timestamp} |`);
  lines.push(`| ${t('report_score')} | ${report.score}/100 |`);
  lines.push(`| ${t('adsense_gate_label')} | ${report.gateChecksPassed ? t('adsense_gate_ok') : t('adsense_gate_fail')} |`);
  lines.push(`| ${t('report_checks')} | ${report.passed} ${t('report_passed')}, ${report.failed} ${t('report_failed')}, ${report.warnings} ${t('report_info')} |`);
  lines.push('');

  if (!report.gateChecksPassed) {
    lines.push(`> **${t('adsense_gate_warning')}**`);
    lines.push('');
  }

  // Group by severity
  const critical = report.checks.filter((c) => c.severity === 'critical');
  const warning = report.checks.filter((c) => c.severity === 'warning');
  const info = report.checks.filter((c) => c.severity === 'info');

  const renderGroup = (title: string, items: CheckResult[]) => {
    lines.push(`## ${title}`);
    lines.push('');
    lines.push('| # | Status | Details |');
    lines.push('|---|--------|---------|');
    for (const check of items) {
      const status = check.passed ? t('status_pass') : t('status_fail');
      lines.push(`| ${check.id} ${check.title} | ${status} | ${check.details} |`);
    }
    lines.push('');
  };

  if (critical.length > 0) renderGroup(t('report_critical'), critical);
  if (warning.length > 0) renderGroup(t('report_warning'), warning);
  if (info.length > 0) renderGroup(t('report_info_title'), info);

  return lines.join('\n');
}
