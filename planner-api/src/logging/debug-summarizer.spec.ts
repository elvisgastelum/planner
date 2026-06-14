import { describe, expect, it, jest } from '@jest/globals';

import { formatDebugMessage, summarizeValue } from './debug-summarizer';

describe('debug-summarizer', () => {
  it('summarizes primitives and strings', () => {
    expect(summarizeValue(null)).toBeNull();
    expect(summarizeValue(undefined)).toBeUndefined();
    expect(summarizeValue(123)).toBe(123);
    expect(summarizeValue(true)).toBe(true);
    expect(summarizeValue('abc')).toBe('abc');
    expect(summarizeValue('a'.repeat(221))).toBe(`${'a'.repeat(219)}…`);
  });

  it('summarizes arrays and objects', () => {
    expect(summarizeValue([1, 2, 3, 4])).toEqual({
      type: 'array',
      length: 4,
      sample: [1, 2, 3],
    });

    const value = {
      first: 1,
      second: { nested: true },
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6,
      seventh: 7,
      eighth: 8,
      ninth: 9,
      tenth: 10,
      eleventh: 11,
      twelfth: 12,
    };

    expect(summarizeValue(value)).toEqual({
      first: 1,
      second: { nested: true },
      third: 3,
      fourth: 4,
      fifth: 5,
      sixth: 6,
      seventh: 7,
      eighth: 8,
      ninth: 9,
      tenth: 10,
    });
  });

  it('summarizes errors and circular references', () => {
    const error = new Error('problem');
    const errorSummary = summarizeValue(error) as {
      name: string;
      message: string;
      stack?: string;
    };

    expect(errorSummary.name).toBe('Error');
    expect(errorSummary.message).toBe('problem');
    expect(errorSummary.stack).toBeDefined();
    expect(errorSummary.stack?.length).toBeLessThanOrEqual(500);

    const circular: { label: string; self?: unknown } = { label: 'root' };
    circular.self = circular;

    expect(summarizeValue(circular)).toEqual({
      label: 'root',
      self: '[Circular]',
    });
  });

  it('formats debug messages', () => {
    expect(formatDebugMessage('Label')).toBe('Label');
    expect(formatDebugMessage('Label', { foo: 'bar' })).toBe(
      'Label {"foo":"bar"}',
    );
  });

  it('falls back when serialization fails', () => {
    const stringifySpy = jest
      .spyOn(JSON, 'stringify')
      .mockImplementation(() => {
        throw new Error('boom');
      });

    expect(formatDebugMessage('Label', { foo: 'bar' })).toBe(
      'Label [unserializable payload]',
    );

    stringifySpy.mockRestore();
  });
});
