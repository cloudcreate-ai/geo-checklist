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

## CLI Usage

```bash
# Audit a URL (JSON report to stdout)
npx geo-checklist https://example.com

# Save report to file + human-readable summary to stderr
npx geo-checklist https://example.com --output report.json --verbose

# Development
npm run dev -- https://example.com --verbose
npm test
npm run build
```

## Documentation

See [CHECKLIST.md](./CHECKLIST.md) for the full audit checklist (12 categories, 67 items).
