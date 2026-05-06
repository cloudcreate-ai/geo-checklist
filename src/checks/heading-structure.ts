import type { CheckDefinition } from '../types';

const CATEGORY = 'Heading Structure';

export const headingStructureChecks: CheckDefinition[] = [
  {
    id: '2.1',
    title: 'Exactly one h1 per page',
    severity: 'critical',
    execute: (ctx) => {
      const h1s = ctx.doc('h1');
      const count = h1s.length;
      if (count === 0) {
        return { id: '2.1', category: CATEGORY, title: 'Exactly one h1 per page', severity: 'critical', passed: false, details: 'No <h1> tag found.', recommendation: 'Add exactly one <h1> tag to the page.' };
      }
      if (count > 1) {
        return { id: '2.1', category: CATEGORY, title: 'Exactly one h1 per page', severity: 'critical', passed: false, value: count, details: `Found ${count} <h1> tags.`, recommendation: 'Use exactly one <h1> tag per page.' };
      }
      return { id: '2.1', category: CATEGORY, title: 'Exactly one h1 per page', severity: 'critical', passed: true, details: 'Exactly one <h1> found.' };
    },
  },
  {
    id: '2.2',
    title: 'H1 contains meaningful content',
    severity: 'warning',
    execute: (ctx) => {
      const h1Text = ctx.doc('h1').text().trim();
      if (!h1Text) {
        return { id: '2.2', category: CATEGORY, title: 'H1 contains meaningful content', severity: 'warning', passed: false, details: '<h1> is empty or contains only whitespace.' };
      }
      if (h1Text.length < 3) {
        return { id: '2.2', category: CATEGORY, title: 'H1 contains meaningful content', severity: 'warning', passed: false, value: h1Text, details: 'H1 content is too short.' };
      }
      return { id: '2.2', category: CATEGORY, title: 'H1 contains meaningful content', severity: 'warning', passed: true, value: h1Text, details: `H1: "${h1Text}".` };
    },
  },
  {
    id: '2.3',
    title: 'Heading hierarchy correct (no skips)',
    severity: 'warning',
    execute: (ctx) => {
      const headings = ctx.doc('h1, h2, h3, h4, h5, h6');
      const levels = headings.map((_, el) => parseInt(el.tagName[1], 10)).toArray();
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          return { id: '2.3', category: CATEGORY, title: 'Heading hierarchy correct (no skips)', severity: 'warning', passed: false, details: `Heading level skipped from h${levels[i - 1]} to h${levels[i]}.`, recommendation: 'Ensure heading hierarchy has no gaps (h1→h2→h3).' };
        }
      }
      return { id: '2.3', category: CATEGORY, title: 'Heading hierarchy correct (no skips)', severity: 'warning', passed: true, details: 'Heading hierarchy is correct.' };
    },
  },
  {
    id: '2.4',
    title: 'Headings are descriptive',
    severity: 'info',
    execute: (ctx) => {
      const headings = ctx.doc('h1, h2, h3, h4, h5, h6');
      const generic = ['menu', 'navigation', 'skip', 'search'];
      let hasGeneric = false;
      headings.each((_, el) => {
        const text = ctx.doc(el).text().trim().toLowerCase();
        if (generic.some((g) => text.includes(g))) hasGeneric = true;
      });
      if (hasGeneric) {
        return { id: '2.4', category: CATEGORY, title: 'Headings are descriptive', severity: 'info', passed: false, details: 'Some headings use generic text.', recommendation: 'Use descriptive headings that reflect page content.' };
      }
      return { id: '2.4', category: CATEGORY, title: 'Headings are descriptive', severity: 'info', passed: true, details: 'Headings appear descriptive.' };
    },
  },
];
