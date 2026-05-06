import type { CheckDefinition } from '../types';
import { TITLE_MIN_LENGTH, TITLE_MAX_LENGTH, DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH } from '../config';

const CATEGORY = 'Meta & Head';

export const metaHeadChecks: CheckDefinition[] = [
  {
    id: '1.1',
    title: 'Title tag exists and is 30-60 chars',
    severity: 'critical',
    execute: (ctx) => {
      const title = ctx.doc('head title').text().trim();
      const length = title.length;
      if (!title) {
        return {
          id: '1.1',
          category: CATEGORY,
          title: 'Title tag exists and is 30-60 chars',
          severity: 'critical',
          passed: false,
          details: 'No <title> tag found.',
          recommendation: 'Add a <title> tag in the <head> with 30-60 characters.',
        };
      }
      if (length < TITLE_MIN_LENGTH || length > TITLE_MAX_LENGTH) {
        return {
          id: '1.1',
          category: CATEGORY,
          title: 'Title tag exists and is 30-60 chars',
          severity: 'critical',
          passed: false,
          value: length,
          details: `Title is ${length} chars (recommended ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH}).`,
          recommendation: 'Adjust title length to 30-60 characters.',
        };
      }
      return {
        id: '1.1',
        category: CATEGORY,
        title: 'Title tag exists and is 30-60 chars',
        severity: 'critical',
        passed: true,
        value: length,
        details: `Title is ${length} chars.`,
      };
    },
  },
  {
    id: '1.2',
    title: 'Meta description exists and is 120-160 chars',
    severity: 'warning',
    execute: (ctx) => {
      const description = ctx.doc('head meta[name="description"]').attr('content') || '';
      const length = description.length;
      if (!description) {
        return {
          id: '1.2',
          category: CATEGORY,
          title: 'Meta description exists and is 120-160 chars',
          severity: 'warning',
          passed: false,
          details: 'No meta description found.',
          recommendation: 'Add a <meta name="description"> with 120-160 characters.',
        };
      }
      if (length < DESCRIPTION_MIN_LENGTH || length > DESCRIPTION_MAX_LENGTH) {
        return {
          id: '1.2',
          category: CATEGORY,
          title: 'Meta description exists and is 120-160 chars',
          severity: 'warning',
          passed: false,
          value: length,
          details: `Description is ${length} chars (recommended ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH}).`,
          recommendation: 'Adjust meta description length to 120-160 characters.',
        };
      }
      return {
        id: '1.2',
        category: CATEGORY,
        title: 'Meta description exists and is 120-160 chars',
        severity: 'warning',
        passed: true,
        value: length,
        details: `Description is ${length} chars.`,
      };
    },
  },
  {
    id: '1.3',
    title: 'Meta robots not blocking indexing',
    severity: 'critical',
    execute: (ctx) => {
      const robots = ctx.doc('head meta[name="robots"]').attr('content') || '';
      const noindex = ctx.doc('head meta[name="robots"]').attr('content')?.includes('noindex') ?? false;
      if (noindex) {
        return {
          id: '1.3',
          category: CATEGORY,
          title: 'Meta robots not blocking indexing',
          severity: 'critical',
          passed: false,
          details: 'Page has noindex directive in meta robots.',
          recommendation: 'Remove noindex from meta robots if page should be indexed.',
        };
      }
      return {
        id: '1.3',
        category: CATEGORY,
        title: 'Meta robots not blocking indexing',
        severity: 'critical',
        passed: true,
        details: 'No noindex directive found.',
      };
    },
  },
  {
    id: '1.4',
    title: 'Canonical URL set',
    severity: 'warning',
    execute: (ctx) => {
      const canonical = ctx.doc('head link[rel="canonical"]').attr('href') || '';
      if (!canonical) {
        return {
          id: '1.4',
          category: CATEGORY,
          title: 'Canonical URL set',
          severity: 'warning',
          passed: false,
          details: 'No canonical link found.',
          recommendation: 'Add <link rel="canonical"> to prevent duplicate content issues.',
        };
      }
      return {
        id: '1.4',
        category: CATEGORY,
        title: 'Canonical URL set',
        severity: 'warning',
        passed: true,
        value: canonical,
        details: `Canonical URL: ${canonical}.`,
      };
    },
  },
  {
    id: '1.5',
    title: 'Viewport meta tag set',
    severity: 'warning',
    execute: (ctx) => {
      const viewport = ctx.doc('head meta[name="viewport"]').attr('content') || '';
      if (!viewport) {
        return {
          id: '1.5',
          category: CATEGORY,
          title: 'Viewport meta tag set',
          severity: 'warning',
          passed: false,
          details: 'No viewport meta tag found.',
          recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">.',
        };
      }
      return {
        id: '1.5',
        category: CATEGORY,
        title: 'Viewport meta tag set',
        severity: 'warning',
        passed: true,
        value: viewport,
        details: `Viewport: ${viewport}.`,
      };
    },
  },
];
