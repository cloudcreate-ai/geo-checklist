# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Geo-Checklist** is an SEO & GEO audit checklist project. It defines 12 categories (67 items) of checks for auditing websites against:

- **SEO** — traditional search engine ranking factors (Google, Bing)
- **GEO** — optimization for AI-powered answer engines (ChatGPT, Gemini, Perplexity, Claude, Bing Copilot)

## Repository Structure

This repo currently contains documentation only — no source code has been implemented yet.

| File | Purpose |
|------|---------|
| `README.md` | Project overview and delivery method descriptions |
| `CHECKLIST.md` | The full audit checklist (12 categories, 67 items across SEO and GEO phases) |

## Planned Delivery Methods

The same check rules are intended to power three delivery methods:

1. **Browser Extension** — Chrome/Firefox extension for one-click page audits
2. **CLI for Agent** — `npx geo-checklist <url>` returning JSON reports
3. **Skill for Agent** — Claude Code / MCP skill for automated site audits

## Working with this repo

- Any new implementation should follow the checklist structure in `CHECKLIST.md` as the source of truth for audit rules.
- Each check item (e.g., `1.1`, `8.3`, `11.5`) should be traceable back to the checklist.
