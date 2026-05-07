import type { CheckDefinition } from './types';
import { extractVisibleText, countWords } from './utils/text-extract';

const CATEGORY = 'AdSense Compliance';

// Policy violation keyword lists — use word boundaries and context-aware patterns
// to reduce false positives from game names (e.g., "Bomb" as a puzzle game title).
const POLICY_CATEGORIES: Record<string, { strict: RegExp; contextual: RegExp }> = {
  // Adult: mostly safe — explicit terms rarely appear in benign contexts
  adult: {
    strict: /\b(porn|xxx|escort|prostitut|onlyfans|camgirl|webcam|blowjob|handjob|intercourse|orgasm)\b/gi,
    contextual: /\b(sex|erotic|nude|naked)\b/gi,
  },
  // Violence: weapon terms like "bomb" are common in puzzle/casual games — require context
  violence: {
    strict: /\b(murder|torture|gore|massacre|terrorism|terrorist|assassination|homicide)\b/gi,
    contextual: /\b(gun|weapon|bomb|kill|blood|dead|corpse|suicide)\b/gi,
  },
  // Gambling: mostly safe — these terms are specific
  gambling: {
    strict: /\b(betting|wager|blackjack|roulette|bookmaker|sportsbook|baccarat|craps|keno)\b/gi,
    contextual: /\b(casino|poker|slot machine|jackpot|lottery|gamble)\b/gi,
  },
  // Drugs: "meth" can appear in game names — require context
  drugs: {
    strict: /\b(cocaine|heroin|fentanyl|xanax|opioid)\b/gi,
    contextual: /\b(marijuana|cannabis|crack|lsd|ecstasy|psychedelic|hallucinogen|weed|hash)\b/gi,
  },
};

function analyzePolicyMatches(category: string, strictMatches: string[], contextualMatches: string[]): { flagged: boolean; reason: string } {
  if (strictMatches.length > 0) {
    return { flagged: true, reason: `${category} (strict): ${strictMatches.slice(0, 3).join(', ')}` };
  }
  // Contextual terms: only flag if there are 3+ different matches (reduces game name false positives)
  if (contextualMatches.length >= 3) {
    const unique = [...new Set(contextualMatches.map((m) => m.toLowerCase()))];
    return { flagged: true, reason: `${category} (contextual, ${unique.length} matches): ${unique.slice(0, 3).join(', ')}` };
  }
  return { flagged: false, reason: '' };
}

export const adsenseChecks: CheckDefinition[] = [
  // A.1: Required pages exist (static)
  {
    id: 'A.1',
    title: 'Required pages (About, Contact, Privacy, Terms)',
    severity: 'critical',
    execute: (ctx) => {
      const required = [
        { key: 'about', patterns: [/about/i, /about\s*us/i] },
        { key: 'contact', patterns: [/contact/i, /contact\s*us/i] },
        { key: 'privacy', patterns: [/privacy/i, /privacy\s*policy/i] },
        { key: 'terms', patterns: [/terms/i, /terms\s*of\s*service/i, /tos/i, /terms\s*and\s*conditions/i] },
      ];

      const links = ctx.doc('a[href]');
      const found: string[] = [];
      const missing: string[] = [];

      for (const req of required) {
        const match = links.toArray().some((el) => {
          const link = ctx.doc(el);
          const href = (link.attr('href') || '').toLowerCase();
          const text = link.text().trim().toLowerCase();
          return req.patterns.some((p) => p.test(text) || p.test(href));
        });
        if (match) found.push(req.key);
        else missing.push(req.key);
      }

      // AdSense requires at least About, Contact, and Privacy
      const criticalRequired = ['about', 'contact', 'privacy'];
      const criticalFound = criticalRequired.filter((k) => found.includes(k));
      const allPassed = criticalFound.length === criticalRequired.length;

      if (allPassed) {
        return { id: 'A.1', category: CATEGORY, title: 'Required pages (About, Contact, Privacy, Terms)', severity: 'critical', passed: true, details: `Found: ${found.join(', ')}.` };
      }
      return { id: 'A.1', category: CATEGORY, title: 'Required pages (About, Contact, Privacy, Terms)', severity: 'critical', passed: false, details: `Found: ${found.join(', ') || 'none'}. Missing: ${missing.join(', ')}.`, recommendation: `Add links to ${missing.join(', ')} pages in your navigation or footer.` };
    },
  },

  // A.2: Template content ratio (browser — stub)
  {
    id: 'A.2',
    title: 'Template content ratio < 60%',
    severity: 'critical',
    execute: () => ({ id: 'A.2', category: CATEGORY, title: 'Template content ratio < 60%', severity: 'critical', passed: false, details: 'Requires browser rendering to analyze content ratio.' }),
  },

  // A.3: Content originality (browser — stub)
  {
    id: 'A.3',
    title: 'Content originality across pages',
    severity: 'warning',
    execute: () => ({ id: 'A.3', category: CATEGORY, title: 'Content originality across pages', severity: 'warning', passed: false, details: 'Requires multi-page crawl analysis.' }),
  },

  // A.4: Policy-violating content (static)
  {
    id: 'A.4',
    title: 'No policy-violating content',
    severity: 'critical',
    execute: (ctx) => {
      const text = extractVisibleText(ctx.html);
      const flagged: string[] = [];

      for (const [category, { strict, contextual }] of Object.entries(POLICY_CATEGORIES)) {
        const strictMatches = text.match(strict) || [];
        const contextualMatches = text.match(contextual) || [];
        const analysis = analyzePolicyMatches(category, strictMatches, contextualMatches);
        if (analysis.flagged) {
          flagged.push(analysis.reason);
        }
      }

      if (flagged.length === 0) {
        return { id: 'A.4', category: CATEGORY, title: 'No policy-violating content', severity: 'critical', passed: true, details: 'No policy-violating content detected.' };
      }
      return { id: 'A.4', category: CATEGORY, title: 'No policy-violating content', severity: 'critical', passed: false, details: `Flagged categories: ${flagged.join('; ')}.`, recommendation: 'Review flagged content — AdSense may reject sites with policy-violating material.' };
    },
  },

  // A.5: Ads.txt presence (static)
  {
    id: 'A.5',
    title: 'Ads.txt file exists',
    severity: 'warning',
    execute: (ctx) => {
      const html = ctx.html.toLowerCase();
      const hasAdsTxtLink = html.includes('ads.txt') && /href\s*=\s*["'][^"']*ads\.txt["']/i.test(ctx.html);
      // Note: actual ads.txt presence check requires separate fetch, done as info here
      return { id: 'A.5', category: CATEGORY, title: 'Ads.txt file exists', severity: 'warning', passed: hasAdsTxtLink || true, details: 'Ads.txt presence requires separate fetch check at /ads.txt. Referenced in page: ' + (hasAdsTxtLink ? 'yes' : 'no'), recommendation: 'Ensure https://<domain>/ads.txt exists and is properly configured.' };
    },
  },

  // A.6: Ad network scripts (static)
  {
    id: 'A.6',
    title: 'Ad network scripts detected',
    severity: 'info',
    execute: (ctx) => {
      const networks = [
        { name: 'Google AdSense', pattern: /adsbygoogle|googlesyndication/i },
        { name: 'Google Ad Manager', pattern: /googletag|gpt\.js/i },
        { name: 'Amazon Ads', pattern: /amazon-adsystem/i },
        { name: 'Taboola', pattern: /taboola/i },
        { name: 'Outbrain', pattern: /outbrain/i },
        { name: 'Media.net', pattern: /media\.net/i },
      ];

      const detected: string[] = [];
      for (const net of networks) {
        if (net.pattern.test(ctx.html)) {
          detected.push(net.name);
        }
      }

      if (detected.length === 0) {
        return { id: 'A.6', category: CATEGORY, title: 'Ad network scripts detected', severity: 'info', passed: true, details: 'No ad network scripts detected. Site may not be monetized yet.' };
      }
      return { id: 'A.6', category: CATEGORY, title: 'Ad network scripts detected', severity: 'info', passed: true, value: detected.length, details: `Detected: ${detected.join(', ')}.` };
    },
  },

  // A.7: Cookie/privacy consent (browser — stub)
  {
    id: 'A.7',
    title: 'Cookie/privacy consent mechanism',
    severity: 'warning',
    execute: () => ({ id: 'A.7', category: CATEGORY, title: 'Cookie/privacy consent mechanism', severity: 'warning', passed: false, details: 'Requires browser rendering to detect consent UI.' }),
  },

  // A.8: Content depth assessment (static)
  {
    id: 'A.8',
    title: 'Content depth sufficient',
    severity: 'warning',
    execute: (ctx) => {
      // Count paragraphs in main content area
      const mainContent = ctx.doc('main, article, [role="main"], #content, .content, .post, .entry');
      const paragraphs = mainContent.length > 0
        ? mainContent.find('p')
        : ctx.doc('body > p, body p');
      const paragraphCount = paragraphs.toArray().filter((el) => {
        const text = ctx.doc(el).text().trim();
        return text.length > 20;
      }).length;

      const imagesWithAlt = ctx.doc('img[alt]').toArray().filter((el) => ctx.doc(el).attr('alt')?.trim().length).length;
      const tables = ctx.doc('table').length;

      // Calculate average paragraph length
      let totalWords = 0;
      let countedParas = 0;
      paragraphs.toArray().forEach((el) => {
        const text = ctx.doc(el).text().trim();
        if (text.length > 20) {
          totalWords += countWords(text);
          countedParas++;
        }
      });
      const avgLength = countedParas > 0 ? Math.round(totalWords / countedParas) : 0;

      // Pass if: >= 5 paragraphs with avg >= 20 words, OR has images with alt, OR has tables
      const hasSufficientText = paragraphCount >= 5 && avgLength >= 20;
      const hasVisualContent = imagesWithAlt >= 2 || tables >= 1;

      if (hasSufficientText || hasVisualContent) {
        return { id: 'A.8', category: CATEGORY, title: 'Content depth sufficient', severity: 'warning', passed: true, value: paragraphCount, details: `${paragraphCount} paragraphs (avg ${avgLength} words each), ${imagesWithAlt} images with alt, ${tables} tables.` };
      }
      return { id: 'A.8', category: CATEGORY, title: 'Content depth sufficient', severity: 'warning', passed: false, details: `${paragraphCount} paragraphs (avg ${avgLength} words each), ${imagesWithAlt} images with alt, ${tables} tables.`, recommendation: 'Add more substantial content — longer paragraphs, images with descriptions, or data tables.' };
    },
  },

  // A.9: Directory-level similarity analysis (browser — stub)
  {
    id: 'A.9',
    title: 'Directory-level content uniqueness',
    severity: 'critical',
    execute: () => ({ id: 'A.9', category: CATEGORY, title: 'Directory-level content uniqueness', severity: 'critical', passed: false, details: 'Requires site-wide crawl and directory grouping.' }),
  },
];
