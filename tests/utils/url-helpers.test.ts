import { describe, it, expect } from 'vitest';
import { getOrigin, resolveRelative, getSitemapUrl, getRobotsUrl } from '../../src/utils/url-helpers';

describe('url-helpers', () => {
  describe('getOrigin', () => {
    it('extracts origin from URL', () => {
      expect(getOrigin(new URL('https://example.com/path?q=1'))).toBe('https://example.com');
    });
  });

  describe('resolveRelative', () => {
    it('resolves relative path', () => {
      expect(resolveRelative(new URL('https://example.com/page'), '/sitemap.xml')).toBe('https://example.com/sitemap.xml');
    });

    it('passes through absolute URL', () => {
      expect(resolveRelative(new URL('https://example.com'), 'https://other.com/sitemap.xml')).toBe('https://other.com/sitemap.xml');
    });
  });

  describe('getSitemapUrl', () => {
    it('returns standard sitemap path', () => {
      expect(getSitemapUrl('https://example.com')).toBe('https://example.com/sitemap.xml');
    });
  });

  describe('getRobotsUrl', () => {
    it('returns standard robots.txt path', () => {
      expect(getRobotsUrl('https://example.com')).toBe('https://example.com/robots.txt');
    });
  });
});
