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

export function printMarkdown(report: AuditReport): string {
  const lines: string[] = [];
  const scoreBadge = (s: number) => (s >= 80 ? '🟢' : s >= 50 ? '🟡' : '🔴');

  lines.push(`# Geo-Checklist SEO & GEO Audit`);
  lines.push('');
  lines.push(`- **URL**: ${report.url}`);
  lines.push(`- **时间**: ${new Date(report.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push(`- **总分**: ${scoreBadge(report.score)} ${report.score} / 100`);
  lines.push(`- **加载时间**: ${report.metadata.loadTimeMs}ms | **状态码**: ${report.metadata.statusCode}`);
  lines.push(`- **检查总数**: ${report.totalChecks} 项（${report.passed} 通过 / ${report.failed} 失败 / ${report.warnings} info）`);
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

    // Summary table
    lines.push(`| # | 检查项 | 状态 | 详情 | 建议 |`);
    lines.push(`|---|--------|------|------|------|`);

    for (const check of checks) {
      const status = check.passed ? '**通过**' : check.severity === 'info' ? '跳过/信息' : '**失败**';
      const details = check.details;
      const rec = check.recommendation || (check.passed ? '—' : '');
      lines.push(`| ${check.id} | ${check.title} | ${status} | ${details} | ${rec} |`);
    }
    lines.push('');

    // Category summary
    const catPassed = checks.filter((c) => c.passed).length;
    lines.push(`**小结**: ${catPassed}/${checks.length} 通过。`);
    lines.push('');
  }

  // Fix priority summary
  const failedChecks = report.checks.filter((c) => !c.passed && c.severity === 'critical');
  const warningChecks = report.checks.filter((c) => !c.passed && c.severity === 'warning');

  if (failedChecks.length > 0 || warningChecks.length > 0) {
    lines.push(`---`);
    lines.push('');
    lines.push(`## 修复优先级总结`);
    lines.push('');

    if (failedChecks.length > 0) {
      lines.push(`### 立即修复（${failedChecks.length} 项）`);
      lines.push('');
      lines.push(`| 优先级 | 检查项 | 操作 |`);
      lines.push(`|--------|--------|------|`);
      for (const c of failedChecks) {
        lines.push(`| **P0** | ${c.id} ${c.title} | ${c.recommendation || c.details} |`);
      }
      lines.push('');
    }

    if (warningChecks.length > 0) {
      lines.push(`### 建议优化（${warningChecks.length} 项）`);
      lines.push('');
      lines.push(`| 优先级 | 检查项 | 操作 |`);
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
