import { describe, it, expect } from 'vitest';
import { parseHtml } from '../../src/utils/parse-html';

describe('parseHtml', () => {
  it('parses basic HTML', () => {
    const doc = parseHtml('<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>');
    expect(doc('title').text()).toBe('Test');
    expect(doc('h1').text()).toBe('Hello');
  });

  it('handles malformed HTML gracefully', () => {
    const doc = parseHtml('<div><p>unclosed');
    expect(doc('p').text()).toBe('unclosed');
  });
});
