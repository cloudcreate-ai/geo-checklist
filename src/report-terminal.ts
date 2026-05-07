import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';
import type { AuditReport } from './types';
import { printMarkdown } from './report';

marked.use(markedTerminal() as Parameters<typeof marked.use>[0]);

export function printMarkdownTerminal(report: AuditReport): void {
  const md = printMarkdown(report);
  const rendered = marked.parse(md) as string;
  process.stderr.write('\n');
  process.stderr.write(rendered);
  process.stderr.write('\n');
}
