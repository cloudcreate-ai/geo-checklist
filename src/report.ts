import chalk from 'chalk';
import type { AuditContext, AuditReport, CheckResult } from './types';

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

const CATEGORY_HEADER = '\n';

export function printSummary(report: AuditReport): void {
  const scoreColor = (score: number) => {
    if (score >= 80) return chalk.green;
    if (score >= 50) return chalk.yellow;
    return chalk.red;
  };

  process.stderr.write('\n');
  process.stderr.write(chalk.bold('  Geo-Checklist SEO & GEO Audit\n'));
  process.stderr.write(chalk.dim('  URL: ').concat(`${report.url}\n`));
  process.stderr.write(chalk.dim('  Score: ').concat(`${scoreColor(report.score)(`${report.score}/100`)}\n`));
  process.stderr.write(chalk.dim('  Checks: ').concat(`${report.passed} passed, ${report.failed} failed, ${report.warnings} info\n`));
  process.stderr.write(chalk.dim('  Load: ').concat(`${report.metadata.loadTimeMs}ms | HTTP ${report.metadata.statusCode}\n`));
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
