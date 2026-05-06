import { describe, it, expect } from 'vitest';
import { extractVisibleText, countWords } from '../../src/utils/text-extract';

describe('text-extract', () => {
  describe('extractVisibleText', () => {
    it('extracts visible text without scripts/styles', () => {
      const html = '<html><body><p>Hello World</p><script>var x=1</script><style>.a{}</style></body></html>';
      expect(extractVisibleText(html)).toBe('Hello World');
    });

    it('handles empty body', () => {
      const html = '<html><body></body></html>';
      expect(extractVisibleText(html)).toBe('');
    });
  });

  describe('countWords', () => {
    it('counts words correctly', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('')).toBe(0);
      expect(countWords('one')).toBe(1);
      expect(countWords('hello   world  test')).toBe(3);
    });
  });
});
