import {
  isEmpty,
  isNotEmpty,
  capitalize,
  toCamelCase,
  truncate,
  contains,
  isNumeric,
  isAlpha,
  isAlphanumeric
} from '../src/string';

describe('String Utils', () => {
  describe('isEmpty', () => {
    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for whitespace only', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return false for empty string', () => {
      expect(isNotEmpty('')).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(isNotEmpty('hello')).toBe(true);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should lowercase rest of string', () => {
      expect(capitalize('hELLO')).toBe('Hello');
    });
  });

  describe('toCamelCase', () => {
    it('should convert to camelCase', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
    });

    it('should handle single word', () => {
      expect(toCamelCase('hello')).toBe('hello');
    });
  });

  describe('truncate', () => {
    it('should truncate long string', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should not truncate short string', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should use custom suffix', () => {
      expect(truncate('hello world', 8, '***')).toBe('hello***');
    });
  });

  describe('contains', () => {
    it('should find substring', () => {
      expect(contains('hello world', 'world')).toBe(true);
    });

    it('should not find missing substring', () => {
      expect(contains('hello world', 'foo')).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(contains('Hello World', 'world', false)).toBe(true);
      expect(contains('Hello World', 'world', true)).toBe(false);
    });
  });

  describe('isNumeric', () => {
    it('should return true for numeric string', () => {
      expect(isNumeric('123')).toBe(true);
    });

    it('should return false for non-numeric string', () => {
      expect(isNumeric('abc')).toBe(false);
    });

    it('should return false for mixed string', () => {
      expect(isNumeric('123abc')).toBe(false);
    });
  });

  describe('isAlpha', () => {
    it('should return true for alphabetic string', () => {
      expect(isAlpha('abc')).toBe(true);
    });

    it('should return false for numeric string', () => {
      expect(isAlpha('123')).toBe(false);
    });

    it('should return false for mixed string', () => {
      expect(isAlpha('abc123')).toBe(false);
    });
  });

  describe('isAlphanumeric', () => {
    it('should return true for alphanumeric string', () => {
      expect(isAlphanumeric('abc123')).toBe(true);
    });

    it('should return false for string with special characters', () => {
      expect(isAlphanumeric('abc-123')).toBe(false);
    });

    it('should return true for only letters', () => {
      expect(isAlphanumeric('abc')).toBe(true);
    });

    it('should return true for only numbers', () => {
      expect(isAlphanumeric('123')).toBe(true);
    });
  });
});