import { Command } from 'commander';
import chalk from 'chalk';
import { runAudit } from './analyzer';
import { printSummary, printMarkdown } from './report';
import { printMarkdownTerminal } from './report-terminal';
import { setLocale } from './i18n';
import type { Locale } from './i18n';
import { writeFileSync } from 'node:fs';

const program = new Command();

program
  .name('geo-checklist')
  .description(
    'SEO & GEO audit checklist CLI — audit websites against 71 checks across 12 categories.\n' +
    '\n' +
    'Categories: Meta & Head, Heading Structure, Content Quality, Images & Media,\n' +
    'Links & Navigation, Technical, Social & Rich Media, Structured Data & Semantics,\n' +
    'Entity & Authority Signals, Content Format for AI Extraction, AI Crawler Accessibility,\n' +
    'Answer Engine Specific.\n' +
    '\n' +
    'Supports: http(s) URLs, localhost (e.g. http://localhost:3000)\n' +
    'Uses Playwright Chromium for browser-based checks (mobile, CAPTCHA, interstitials, etc.)\n' +
    'Automatically crawls internal pages for intent analysis (3.2) and multi-page checks.\n'
  )
  .version('0.1.0')
  .argument('<url>', 'URL to audit (e.g. https://example.com or http://localhost:3000)')
  .option('-o, --output <file>', 'Write report to file (auto-named as <domain>_<timestamp> if omitted)')
  .option('-m, --markdown', 'Output as Markdown instead of JSON')
  .option('-v, --verbose', 'Print human-readable summary to stderr')
  .option('--max-pages <number>', 'Max pages to crawl for intent analysis (default: 20)', parseInt)
  .option('--max-depth <number>', 'Max crawl depth for intent analysis (default: 1, only direct links from homepage)', parseInt)
  .option('--lang <locale>', 'Output language: en (default), zh (Simplified Chinese)', 'en')
  .option('--fast', 'Skip browser-based checks for faster static-only audit')
  .option('--page-timeout <ms>', 'Timeout for browser page load in ms (default: 30000)', parseInt)
  .action(async (url: string, options: { output?: string; markdown?: boolean; verbose?: boolean; maxPages?: number; maxDepth?: number; lang?: string; fast?: boolean; pageTimeout?: number }) => {
    const lang = options.lang as Locale;
    if (!['en', 'zh'].includes(lang)) {
      process.stderr.write(chalk.red(`Error: Unsupported language '${lang}'. Use 'en' or 'zh'.\n`));
      process.exit(1);
    }
    setLocale(lang);

    const crawlOpts = {
      maxPages: options.maxPages ?? 20,
      maxDepth: options.maxDepth ?? 1,
      pageTimeout: options.pageTimeout,
    };
    try {
      const report = await runAudit(url, options.verbose, crawlOpts, options.fast);
      const domain = new URL(url).hostname.replace(/^www\./, '');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultName = `${domain}_${ts}`;

      if (options.markdown) {
        const md = printMarkdown(report);
        const outFile = options.output || `${defaultName}.md`;
        writeFileSync(outFile, md, 'utf-8');
        process.stdout.write(md);
        process.stderr.write(`\nMarkdown report written to ${outFile}\n`);
      } else {
        const json = JSON.stringify(report, null, 2);
        const outFile = options.output || `${defaultName}.json`;
        writeFileSync(outFile, json, 'utf-8');
        process.stdout.write(json);
        process.stderr.write(`\nJSON report written to ${outFile}\n`);
      }

      if (options.verbose) {
        printMarkdownTerminal(report);
      }
    } catch (error) {
      process.stderr.write(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

program.parse();
