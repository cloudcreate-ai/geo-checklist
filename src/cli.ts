import { Command } from 'commander';
import chalk from 'chalk';
import { runAudit } from './analyzer';
import { printSummary } from './report';
import { writeFileSync } from 'node:fs';

const program = new Command();

program
  .name('geo-checklist')
  .description('SEO & GEO audit checklist CLI')
  .version('0.1.0')
  .argument('<url>', 'URL to audit')
  .option('-o, --output <file>', 'Write JSON report to file')
  .option('-v, --verbose', 'Print human-readable summary to stderr')
  .action(async (url: string, options: { output?: string; verbose?: boolean }) => {
    try {
      const report = await runAudit(url);
      const json = JSON.stringify(report, null, 2);

      if (options.output) {
        writeFileSync(options.output, json, 'utf-8');
        process.stderr.write(`Report written to ${options.output}\n`);
      }

      process.stdout.write(json);

      if (options.verbose) {
        printSummary(report);
      }
    } catch (error) {
      process.stderr.write(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

program.parse();
