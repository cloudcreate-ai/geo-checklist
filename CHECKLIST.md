# Geo-Checklist — SEO & GEO Audit Checklist

## Overview

A comprehensive checklist for auditing websites against **SEO** (Search Engine Optimization) and **GEO** (Generative Engine Optimization) standards.

**SEO** = traditional search engine ranking factors (Google, Bing)
**GEO** = optimization for AI-powered answer engines (ChatGPT, Gemini, Perplexity, Claude, Bing Copilot)

---

## Phase 1: SEO Checklist

### 1. Meta & Head

| # | Check | Why |
|---|-------|-----|
| 1.1 | `<title>` exists, 30-60 chars, unique per page | Primary ranking signal, shown in SERP |
| 1.2 | `<meta name="description">` exists, 120-160 chars | SERP snippet, CTR impact |
| 1.3 | `<meta name="robots">` not blocking indexing | Prevents accidental deindexing |
| 1.4 | `<link rel="canonical">` set | Prevents duplicate content issues |
| 1.5 | `<meta name="viewport">` set | Mobile-friendliness signal |

### 2. Heading Structure

| # | Check | Why |
|---|-------|-----|
| 2.1 | Exactly one `<h1>` per page | Content hierarchy |
| 2.2 | `<h1>` contains primary keyword/topic | Page topic signal |
| 2.3 | Heading hierarchy correct (h1→h2→h3, no skips) | Semantic structure |
| 2.4 | Headings are descriptive, not generic | Helps crawlers understand sections |

### 3. Content Quality

| # | Check | Why |
|---|-------|-----|
| 3.1 | Minimum 300 words of unique content | Thin content penalty avoidance |
| 3.2 | Content answers user intent for target query | Relevance |
| 3.3 | No duplicate content across pages | Canonicalization |
| 3.4 | Content is up-to-date (freshness signal) | Freshness ranking factor |
| 3.5 | Language attribute (`lang`) set on `<html>` | Correct indexing |

### 4. Images & Media

| # | Check | Why |
|---|-------|-----|
| 4.1 | All `<img>` have `alt` attributes | Accessibility + image search |
| 4.2 | Images have `width`/`height` to prevent CLS | Core Web Vitals |
| 4.3 | Images are optimized (WebP/AVIF, compressed) | Page speed |
| 4.4 | Lazy loading for below-fold images | Performance |

### 5. Links & Navigation

| # | Check | Why |
|---|-------|-----|
| 5.1 | Internal links use descriptive anchor text | Site structure + context |
| 5.2 | No broken links (404s) | Crawl budget + UX |
| 5.3 | No redirect chains (301→301→...) | Crawl efficiency |
| 5.4 | Breadcrumb navigation present | Site structure signal |
| 5.5 | Logical URL structure (semantic, short) | Readability + ranking |
| 5.6 | Sitemap (`/sitemap.xml`) exists and valid | Crawl discovery |
| 5.7 | `robots.txt` exists and correctly configured | Crawl control |

### 6. Technical

| # | Check | Why |
|---|-------|-----|
| 6.1 | Page served over HTTPS | Ranking signal + security |
| 6.2 | Page loads in < 3s (LCP) | Core Web Vitals |
| 6.3 | Mobile-responsive design | Mobile-first indexing |
| 6.4 | No intrusive interstitials | Mobile UX signal |
| 6.5 | Favicon present | Branding |
| 6.6 | 404 page exists and is helpful | UX |
| 6.7 | Server returns correct status codes | Crawl correctness |
| 6.8 | Content is server-rendered or SSR/SSG | Crawlability |

### 7. Social & Rich Media

| # | Check | Why |
|---|-------|-----|
| 7.1 | Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`) | Social sharing |
| 7.2 | Twitter Card tags (`twitter:card`, `twitter:title`, etc.) | Twitter sharing |
| 7.3 | Structured data (JSON-LD) present | Rich results |

---

## Phase 2: GEO Checklist

### 8. Structured Data & Semantics

| # | Check | Why |
|---|-------|-----|
| 8.1 | Schema.org `Organization` markup | Entity identification |
| 8.2 | Schema.org `WebSite` + `SearchAction` markup | Site entity + sitelinks search |
| 8.3 | Schema.org `Article` / `BlogPosting` for content | Content entity typing |
| 8.4 | Schema.org `FAQPage` / `QAPage` where applicable | Q&A extraction by AI |
| 8.5 | Schema.org `Product` / `Service` where applicable | Entity-relation data |
| 8.6 | `sameAs` links to official social profiles | Entity resolution |
| 8.7 | `knowsAbout` / `about` properties on content | Topic-entity mapping |

### 9. Entity & Authority Signals

| # | Check | Why |
|---|-------|-----|
| 9.1 | Author byline with credentials/expertise | E-E-A-T for AI engines |
| 9.2 | Author `Person` schema markup | Author entity resolution |
| 9.3 | Publication/last-modified date visible | Freshness for AI answers |
| 9.4 | Citations and references to authoritative sources | Claim verifiability |
| 9.5 | About page with company/entity details | Entity grounding |
| 9.6 | Contact information clearly presented | Trust signal |
| 9.7 | Privacy policy and terms of service pages | Legitimacy signal |

### 10. Content Format for AI Extraction

| # | Check | Why |
|---|-------|-----|
| 10.1 | FAQ sections with clear Q&A pairs | Direct AI answer extraction |
| 10.2 | Summary/conclusion paragraphs | AI can cite key points |
| 10.3 | Bullet lists and numbered steps | Structured extraction |
| 10.4 | Tables for comparison data | Easy AI parsing |
| 10.5 | Clear topic sentences per paragraph | Paragraph-level extraction |
| 10.6 | Definitions of key terms (glossary style) | Term-entity mapping |
| 10.7 | Avoid content hidden in JS-only components | AI crawler accessibility |

### 11. AI Crawler Accessibility

| # | Check | Why |
|---|-------|-----|
| 11.1 | Content is server-rendered, not SPA-only | AI bots can't execute JS |
| 11.2 | `robots.txt` doesn't block AI crawlers | Allow AI bot access |
| 11.3 | No aggressive bot-detection (CAPTCHA walls) | AI engine access |
| 11.4 | Clean HTML without excessive tracking scripts | Faster parsing |
| 11.5 | Text content not embedded in images | Readable by AI |
| 11.6 | No `noindex` on important pages | AI indexability |
| 11.7 | Sitemap accessible at standard path | AI discovery |

### 12. Answer Engine Specific

| # | Check | Why |
|---|-------|-----|
| 12.1 | Page directly answers specific questions | AI answer matching |
| 12.2 | Key facts in first 100 words | AI snippet extraction |
| 12.3 | "What is X" / "How to" content patterns | Query-intent matching |
| 12.4 | Comparison content (vs, alternative, best) | AI comparison answers |
| 12.5 | Statistics and data with sources | Credible AI citations |
| 12.6 | Brand name mentioned naturally in content | Brand-entity association |
| 12.7 | Consistent entity naming across pages | Entity consolidation |

---

## Delivery Methods

| Method | Description |
|--------|-------------|
| **Browser Extension** | Chrome/Firefox extension — audit current page with one click, show results as overlay |
| **CLI for Agent** | `npx geo-checklist <url>` — returns JSON report, designed for AI agents to parse and act on |
| **Skill for Agent** | Claude Code / MCP skill — integrated into AI coding workflows for automated site audits |
