import type { CheckDefinition } from '../types';

const CATEGORY = 'Images & Media';

export const imagesMediaChecks: CheckDefinition[] = [
  {
    id: '4.1',
    title: 'All images have alt attributes',
    severity: 'critical',
    execute: (ctx) => {
      const images = ctx.doc('img');
      const missingAlt: string[] = [];
      images.each((i, el) => {
        const alt = ctx.doc(el).attr('alt');
        if (alt === undefined || alt === '') {
          const src = ctx.doc(el).attr('src') || `image ${i}`;
          missingAlt.push(src);
        }
      });
      if (missingAlt.length > 0) {
        return { id: '4.1', category: CATEGORY, title: 'All images have alt attributes', severity: 'critical', passed: false, value: missingAlt.length, details: `${missingAlt.length} image(s) missing alt attributes.`, recommendation: 'Add alt attributes to all images for accessibility and image search.' };
      }
      return { id: '4.1', category: CATEGORY, title: 'All images have alt attributes', severity: 'critical', passed: true, details: `All ${images.length} image(s) have alt attributes.` };
    },
  },
  {
    id: '4.2',
    title: 'Images have width and height attributes',
    severity: 'warning',
    execute: (ctx) => {
      const images = ctx.doc('img');
      let missing = 0;
      images.each((_, el) => {
        const width = ctx.doc(el).attr('width');
        const height = ctx.doc(el).attr('height');
        if (!width || !height) missing++;
      });
      if (missing > 0) {
        return { id: '4.2', category: CATEGORY, title: 'Images have width and height attributes', severity: 'warning', passed: false, value: missing, details: `${missing} image(s) missing width/height attributes.`, recommendation: 'Add width and height attributes to prevent Cumulative Layout Shift (CLS).' };
      }
      return { id: '4.2', category: CATEGORY, title: 'Images have width and height attributes', severity: 'warning', passed: true, details: 'All images have width and height attributes.' };
    },
  },
  {
    id: '4.3',
    title: 'Images use modern formats (WebP/AVIF)',
    severity: 'info',
    execute: (ctx) => {
      const images = ctx.doc('img');
      let modern = 0;
      images.each((_, el) => {
        const src = (ctx.doc(el).attr('src') || '').toLowerCase();
        const srcset = (ctx.doc(el).attr('srcset') || '').toLowerCase();
        if (src.includes('.webp') || src.includes('.avif') || srcset.includes('.webp') || srcset.includes('.avif')) {
          modern++;
        }
      });
      const total = images.length;
      if (total === 0) {
        return { id: '4.3', category: CATEGORY, title: 'Images use modern formats (WebP/AVIF)', severity: 'info', passed: true, details: 'No images on page.' };
      }
      if (modern === 0) {
        return { id: '4.3', category: CATEGORY, title: 'Images use modern formats (WebP/AVIF)', severity: 'info', passed: false, details: 'No images using WebP or AVIF format.', recommendation: 'Convert images to WebP or AVIF for better performance.' };
      }
      return { id: '4.3', category: CATEGORY, title: 'Images use modern formats (WebP/AVIF)', severity: 'info', passed: true, value: modern, details: `${modern}/${total} images use modern formats.` };
    },
  },
  {
    id: '4.4',
    title: 'Lazy loading for below-fold images',
    severity: 'info',
    execute: (ctx) => {
      const images = ctx.doc('img');
      let lazyCount = 0;
      images.each((_, el) => {
        const loading = ctx.doc(el).attr('loading');
        if (loading === 'lazy') lazyCount++;
      });
      if (images.length > 0 && lazyCount === 0) {
        return { id: '4.4', category: CATEGORY, title: 'Lazy loading for below-fold images', severity: 'info', passed: false, details: 'No images use lazy loading.', recommendation: 'Add loading="lazy" to below-fold images.' };
      }
      return { id: '4.4', category: CATEGORY, title: 'Lazy loading for below-fold images', severity: 'info', passed: true, details: `Lazy loading applied to some images.` };
    },
  },
];
