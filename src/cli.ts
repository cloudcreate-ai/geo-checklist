import { Command } from 'commander';
import chalk from 'chalk';
import { runAudit } from './analyzer';
import { printSummary, printMarkdown } from './report';
import { printMarkdownTerminal } from './report-terminal';
import { writeFileSync } from 'node:fs';

const program = new Command();

program
  .name('geo-checklist')
  .description('SEO & GEO audit checklist CLI')
  .version('0.1.0')
  .argument('<url>', 'URL to audit')
  .option('-o, --output <file>', 'Write report to file (auto-named as <domain>_<timestamp> if omitted)')
  .option('-m, --markdown', 'Output as Markdown instead of JSON')
  .option('-v, --verbose', 'Print human-readable summary to stderr')
  .action(async (url: string, options: { output?: string; markdown?: boolean; verbose?: boolean }) => {
    try {
      const report = await runAudit(url);
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
