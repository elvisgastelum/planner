import {
  assertCents,
  centsToDecimalAmount,
  decimalStringToCents,
  roundToCents,
} from './money';

describe('money utilities', () => {
  describe('decimalStringToCents', () => {
    it('should convert positive decimal strings to cents', () => {
      expect(decimalStringToCents('123.45')).toBe(12345);
      expect(decimalStringToCents('0.99')).toBe(99);
      expect(decimalStringToCents('1000.00')).toBe(100000);
    });

    it('should convert negative decimal strings to cents', () => {
      expect(decimalStringToCents('-123.45')).toBe(-12345);
      expect(decimalStringToCents('-0.99')).toBe(-99);
    });

    it('should handle whole numbers', () => {
      expect(decimalStringToCents('100')).toBe(10000);
      expect(decimalStringToCents('0')).toBe(0);
    });

    it('should handle decimals with fewer than 2 decimal places', () => {
      expect(decimalStringToCents('123.4')).toBe(12340);
      expect(decimalStringToCents('123')).toBe(12300);
    });

    it('should throw on invalid decimal strings', () => {
      expect(() => decimalStringToCents('abc')).toThrow();
      expect(() => decimalStringToCents('123.456')).toThrow();
      expect(() => decimalStringToCents('')).toThrow();
    });
  });

  describe('centsToDecimalAmount', () => {
    it('should convert positive cents to decimal string', () => {
      expect(centsToDecimalAmount(12345)).toBe('123.45');
      expect(centsToDecimalAmount(99)).toBe('0.99');
      expect(centsToDecimalAmount(100000)).toBe('1000.00');
    });

    it('should convert negative cents to decimal string', () => {
      expect(centsToDecimalAmount(-12345)).toBe('-123.45');
      expect(centsToDecimalAmount(-99)).toBe('-0.99');
    });

    it('should handle zero', () => {
      expect(centsToDecimalAmount(0)).toBe('0.00');
    });

    it('should assert safe integers', () => {
      expect(() => assertCents(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => assertCents(Number.MAX_SAFE_INTEGER + 1)).toThrow();
    });
  });

  describe('roundToCents', () => {
    it('should round to nearest cent', () => {
      expect(roundToCents(123.456)).toBe(12346);
      expect(roundToCents(123.454)).toBe(12345);
      expect(roundToCents(123.5)).toBe(12350);
    });
  });
});
