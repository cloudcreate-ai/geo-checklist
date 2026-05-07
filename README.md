# Geo-Checklist — SEO & GEO Audit Tool

## Overview

A comprehensive tool for auditing websites against **SEO** (Search Engine Optimization) and **GEO** (Generative Engine Optimization) standards.

- **SEO** = traditional search engine ranking factors (Google, Bing)
- **GEO** = optimization for AI-powered answer engines (ChatGPT, Gemini, Perplexity, Claude, Bing Copilot)

## Three Delivery Methods

| Method | Description |
|--------|-------------|
| **Browser Extension** | Chrome/Firefox extension — audit current page with one click, show results as overlay |
| **CLI for Agent** | `npx geo-checklist <url>` — returns JSON report, designed for AI agents to parse and act on |
| **Skill for Agent** | Claude Code / MCP skill — integrated into AI coding workflows for automated site audits |

Core logic is shared — the same check rules power all three delivery methods.

## Features

- **71 checks** across 12 categories
- **JSON output** for machine consumption (stdout), **human-readable summary** to stderr
- **Markdown reports** with per-category tables and fix priority summary
- **Playwright Chromium** for browser-based checks (mobile, CAPTCHA, interstitials, 404, broken links)
- **Internal page crawling** for intent analysis (BFS, configurable depth)
- **Multi-language** — English (default) and Simplified Chinese (`--lang zh`)
- **Localhost support** — works with `http://localhost:<port>` during development

## CLI Usage

```bash
# Audit a URL (JSON report to stdout)
npx geo-checklist https://example.com

# Verbose mode — progress logging + terminal table
npx geo-checklist https://example.com --verbose

# Markdown report to file
npx geo-checklist https://example.com --markdown --output report.md

# Custom crawl settings
npx geo-checklist https://example.com --verbose --max-pages 50 --max-depth 2

# Chinese output
npx geo-checklist https://example.com --verbose --lang zh

# Local development server
npx geo-checklist http://localhost:3000 --verbose
```

## CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `<url>` | (required) | URL to audit (e.g. `https://example.com` or `http://localhost:3000`) |
| `-o, --output <file>` | auto | Write report to file (auto-named as `<domain>_<timestamp>` if omitted) |
| `-m, --markdown` | false | Output as Markdown instead of JSON |
| `-v, --verbose` | false | Print human-readable summary + progress logging to stderr |
| `--max-pages <n>` | 20 | Max pages to crawl for intent analysis |
| `--max-depth <n>` | 1 | Max crawl depth (1 = only direct links from homepage) |
| `--lang <locale>` | en | Output language: `en` (English), `zh` (简体中文) |

## 12 Audit Categories

| # | Category | Checks | Method |
|---|----------|--------|--------|
| 1 | Meta & Head | 1.1-1.5 | Static HTML |
| 2 | Heading Structure | 2.1-2.4 | Static HTML |
| 3 | Content Quality | 3.1-3.5 | Static + Browser crawl |
| 4 | Images & Media | 4.1-4.4 | Static HTML |
| 5 | Links & Navigation | 5.1-5.7 | Static + Browser fetch |
| 6 | Technical | 6.1-6.8 | Static + Browser |
| 7 | Social & Rich Media | 7.1-7.3 | Static HTML |
| 8 | Structured Data & Semantics | 8.1-8.7 | Static HTML |
| 9 | Entity & Authority Signals | 9.1-9.7 | Static HTML |
| 10 | Content Format for AI Extraction | 10.1-10.7 | Static HTML |
| 11 | AI Crawler Accessibility | 11.1-11.7 | Static + Browser |
| 12 | Answer Engine Specific | 12.1-12.7 | Static HTML |

## Development

```bash
npm run dev -- https://example.com --verbose
npm test
npm run build
```

## Documentation

See [CHECKLIST.md](./CHECKLIST.md) for the full audit checklist (12 categories, 67 items).
