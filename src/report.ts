import chalk from 'chalk';
import type { AuditContext, AuditReport, CheckResult } from './types';
import { t, tf } from './i18n';

export function buildReport(ctx: AuditContext, checks: CheckResult[]): AuditReport {
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed && c.severity !== 'info').length;
  const warnings = checks.filter((c) => !c.passed && c.severity === 'info').length;
  const score = Math.round((passed / checks.length) * 100);

  return {
    url: ctx.finalUrl,
    timestamp: new Date().toISOString(),
    totalChecks: checks.length,
    passed,
    failed,
    warnings,
    score,
    checks,
    metadata: {
      loadTimeMs: ctx.loadTimeMs,
      statusCode: ctx.status,
      finalUrl: ctx.finalUrl,
    },
  };
}

export function printMarkdown(report: AuditReport): string {
  const lines: string[] = [];
  const scoreBadge = (s: number) => (s >= 80 ? '🟢' : s >= 50 ? '🟡' : '🔴');

  lines.push(`# ${t('report_title')}`);
  lines.push('');
  lines.push(`- **${t('report_url')}**: ${report.url}`);
  lines.push(`- **${t('report_time')}**: ${new Date(report.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push(`- **${t('report_score')}**: ${scoreBadge(report.score)} ${report.score} / 100`);
  lines.push(`- **${t('report_load')}**: ${report.metadata.loadTimeMs}ms | **${t('report_status')}**: ${report.metadata.statusCode}`);
  lines.push(`- **${t('report_checks')}**: ${report.totalChecks} ${t('report_checks')}（${report.passed} ${t('report_passed')} / ${report.failed} ${t('report_failed')} / ${report.warnings} ${t('report_info')}）`);
  lines.push('');

  const categories = new Map<string, CheckResult[]>();
  for (const check of report.checks) {
    if (!categories.has(check.category)) categories.set(check.category, []);
    categories.get(check.category)!.push(check);
  }

  for (const [category, checks] of categories) {
    lines.push(`---`);
    lines.push('');
    lines.push(`## ${category}`);
    lines.push('');

    lines.push(`| # | ${t('report_checks')} | ${t('report_status')} | ${t('report_checks')} | ${t('report_action')} |`);
    lines.push(`|---|--------|------|------|------|`);

    for (const check of checks) {
      const status = check.passed ? t('status_pass') : check.severity === 'info' ? t('status_info') : t('status_fail');
      const statusMd = !check.passed && check.severity !== 'info' ? `**${status}**` : status;
      const details = check.details;
      const rec = check.recommendation || (check.passed ? '—' : '');
      lines.push(`| ${check.id} | ${check.title} | ${statusMd} | ${details} | ${rec} |`);
    }
    lines.push('');

    // Category summary
    const catPassed = checks.filter((c) => c.passed).length;
    lines.push(`**${t('report_summary')}**: ${catPassed}/${checks.length} ${t('report_passed')}。`);
    lines.push('');
  }

  // Fix priority summary
  const failedChecks = report.checks.filter((c) => !c.passed && c.severity === 'critical');
  const warningChecks = report.checks.filter((c) => !c.passed && c.severity === 'warning');

  if (failedChecks.length > 0 || warningChecks.length > 0) {
    lines.push(`---`);
    lines.push('');
    lines.push(`## ${t('report_fix_priority')}`);
    lines.push('');

    if (failedChecks.length > 0) {
      lines.push(`### ${t('report_fix_now')}（${failedChecks.length} ${t('report_checks')}）`);
      lines.push('');
      lines.push(`| ${t('report_checks')} | ${t('report_checks')} | ${t('report_action')} |`);
      lines.push(`|--------|--------|------|`);
      for (const c of failedChecks) {
        lines.push(`| **P0** | ${c.id} ${c.title} | ${c.recommendation || c.details} |`);
      }
      lines.push('');
    }

    if (warningChecks.length > 0) {
      lines.push(`### ${t('report_optimize')}（${warningChecks.length} ${t('report_checks')}）`);
      lines.push('');
      lines.push(`| ${t('report_checks')} | ${t('report_checks')} | ${t('report_action')} |`);
      lines.push(`|--------|--------|------|`);
      for (const c of warningChecks) {
        lines.push(`| P1 | ${c.id} ${c.title} | ${c.recommendation || c.details} |`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

const CATEGORY_HEADER = '\n';

export function printSummary(report: AuditReport): void {
  const scoreColor = (score: number) => {
    if (score >= 80) return chalk.green;
    if (score >= 50) return chalk.yellow;
    return chalk.red;
  };

  process.stderr.write('\n');
  process.stderr.write(chalk.bold(`  ${t('report_title')}\n`));
  process.stderr.write(chalk.dim(`  ${t('report_url')}: `).concat(`${report.url}\n`));
  process.stderr.write(chalk.dim(`  ${t('report_score')}: `).concat(`${scoreColor(report.score)(`${report.score}/100`)}\n`));
  process.stderr.write(chalk.dim(`  ${t('report_checks')}: `).concat(`${report.passed} ${t('report_passed')}, ${report.failed} ${t('report_failed')}, ${report.warnings} ${t('report_info')}\n`));
  process.stderr.write(chalk.dim(`  ${t('report_load')}: `).concat(`${report.metadata.loadTimeMs}ms | HTTP ${report.metadata.statusCode}\n`));
  process.stderr.write('\n');

  let lastCategory = '';
  for (const check of report.checks) {
    if (check.category !== lastCategory) {
      lastCategory = check.category;
      process.stderr.write(`${CATEGORY_HEADER}  ${chalk.bold.underline(check.category)}\n`);
    }

    const icon = check.passed ? chalk.green('✓') : check.severity === 'info' ? chalk.gray('ℹ') : chalk.red('✗');
    const sev = check.severity === 'critical' ? chalk.red('[critical]') : check.severity === 'warning' ? chalk.yellow('[warning]') : chalk.gray('[info]');
    process.stderr.write(`  ${icon} ${sev} ${check.id} ${check.title}\n`);

    if (check.passed) {
      process.stderr.write(`     ${chalk.dim(check.details)}\n`);
    } else {
      process.stderr.write(`     ${chalk.dim(check.details)}`);
      if (check.recommendation) {
        process.stderr.write(` → ${chalk.cyan(check.recommendation)}`);
      }
      process.stderr.write('\n');
    }
  }
  process.stderr.write('\n');
}
