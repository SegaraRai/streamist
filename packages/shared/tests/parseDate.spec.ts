import { describe, expect, it } from 'vitest';
import { parseDate } from '../src/parseDate';

function parseAndStringify(str: string): string | null {
  const parsed = parseDate(str);
  return parsed
    ? parsed.date$$q
        .toISOString()
        .slice(0, { year: 4, month: 7, day: 10 }[parsed.precision$$q])
    : null;
}

describe('parseDate', () => {
  it('should parse YYYY-mm-dd format', () => {
    expect(parseAndStringify('2022-01-22')).toBe('2022-01-22');
    expect(parseAndStringify('2022/01/22')).toBe('2022-01-22');
    expect(parseAndStringify('2022-01-22+foo')).toBe('2022-01-22');
    expect(parseAndStringify('foo+2022-01-22+bar')).toBe('2022-01-22');
    expect(parseAndStringify('2022-01-22~2023-02-11')).toBe('2022-01-22');
  });

  it('should parse dd-mm-YYYY format', () => {
    expect(parseAndStringify('22-01-2022')).toBe('2022-01-22');
    expect(parseAndStringify('22/01/2022')).toBe('2022-01-22');
    expect(parseAndStringify('22-01-2022+foo')).toBe('2022-01-22');
    expect(parseAndStringify('foo+22-01-2022+bar')).toBe('2022-01-22');
  });

  it('should parse mm-dd-YYYY format if mm is greater than 12', () => {
    expect(parseAndStringify('01-22-2022')).toBe('2022-01-22');
    expect(parseAndStringify('01/22/2022')).toBe('2022-01-22');
    expect(parseAndStringify('01-22-2022+foo')).toBe('2022-01-22');
    expect(parseAndStringify('foo+01-22-2022+bar')).toBe('2022-01-22');
  });

  it('should parse YYYY-mm format', () => {
    expect(parseAndStringify('2022-01')).toBe('2022-01');
    expect(parseAndStringify('2022/01')).toBe('2022-01');
    expect(parseAndStringify('2022-01+foo')).toBe('2022-01');
    expect(parseAndStringify('foo+2022-01+bar')).toBe('2022-01');
    expect(parseAndStringify('2022-01~2023-02')).toBe('2022-01');
  });

  it('should parse mm-YYYY format', () => {
    expect(parseAndStringify('01-2022')).toBe('2022-01');
    expect(parseAndStringify('01/2022')).toBe('2022-01');
    expect(parseAndStringify('01-2022+foo')).toBe('2022-01');
    expect(parseAndStringify('foo+01-2022+bar')).toBe('2022-01');
  });

  it('should parse YYYY format', () => {
    expect(parseAndStringify('2022')).toBe('2022');
    expect(parseAndStringify('2022')).toBe('2022');
    expect(parseAndStringify('2022+foo')).toBe('2022');
    expect(parseAndStringify('foo+2022+bar')).toBe('2022');
    expect(parseAndStringify('2022~2023')).toBe('2022');
  });
});
