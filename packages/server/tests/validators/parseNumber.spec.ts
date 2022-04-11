import { describe, expect, it } from 'vitest';
import { floatOr, integerOr } from '$/services/parseNumber';

describe('integerOr', (): void => {
  it('should accept "2", "02", "002", "30"', (): void => {
    expect(integerOr('2', 0, 1)).toBe(2);
    expect(integerOr('02', 0, 1)).toBe(2);
    expect(integerOr('002', 0, 1)).toBe(2);
    expect(integerOr('30', 0, 1)).toBe(30);
  });

  it('should respect min option', (): void => {
    expect(integerOr('2', 0, 5)).toBe(5);
    expect(integerOr('02', 0, 5)).toBe(5);
    expect(integerOr('002', 0, 5)).toBe(5);
    expect(integerOr('30', 0, 5)).toBe(30);
  });

  it('should use fallback for "", null and undefined', (): void => {
    expect(integerOr('', 0, 1)).toBe(0);
    expect(integerOr(null, 0, 1)).toBe(0);
    expect(integerOr(undefined, 0, 1)).toBe(0);
  });

  it('should use fallback for "2.", "2/4"', (): void => {
    expect(integerOr('2.', 0, 1)).toBe(0);
    expect(integerOr('2/4', 0, 1)).toBe(0);
  });
});

describe('integerOr (loose)', (): void => {
  it('should accept "2", "02", "002", "30"', (): void => {
    expect(integerOr('2', 0, 1, true)).toBe(2);
    expect(integerOr('02', 0, 1, true)).toBe(2);
    expect(integerOr('002', 0, 1, true)).toBe(2);
    expect(integerOr('30', 0, 1, true)).toBe(30);
  });

  it('should accept "2.", "2/4"', (): void => {
    expect(integerOr('2.', 0, 1, true)).toBe(2);
    expect(integerOr('2/4', 0, 1, true)).toBe(2);
  });

  it('should respect min option', (): void => {
    expect(integerOr('2', 0, 5, true)).toBe(5);
    expect(integerOr('02', 0, 5, true)).toBe(5);
    expect(integerOr('002', 0, 5, true)).toBe(5);
    expect(integerOr('30', 0, 5, true)).toBe(30);
  });

  it('should use fallback for "", null and undefined', (): void => {
    expect(integerOr('', 0, 1, true)).toBe(0);
    expect(integerOr(null, 0, 1, true)).toBe(0);
    expect(integerOr(undefined, 0, 1, true)).toBe(0);
  });
});

describe('floatOr', (): void => {
  it('should accept "2", "02", "002", "30"', (): void => {
    expect(floatOr('2', 0)).toBe(2);
    expect(floatOr('02', 0)).toBe(2);
    expect(floatOr('002', 0)).toBe(2);
    expect(floatOr('30', 0)).toBe(30);
  });

  it('should accept "2.5", "02.5", "002.50", "30.500"', (): void => {
    expect(floatOr('2.5', 0)).toBe(2.5);
    expect(floatOr('02.5', 0)).toBe(2.5);
    expect(floatOr('002.50', 0)).toBe(2.5);
    expect(floatOr('30.500', 0)).toBe(30.5);
  });

  it('should use fallback for "", null and undefined', (): void => {
    expect(floatOr('', 0)).toBe(0);
    expect(floatOr(null, 0)).toBe(0);
    expect(floatOr(undefined, 0)).toBe(0);
  });

  it('should use fallback for "2.0.", "2.0/4"', (): void => {
    expect(floatOr('2.0.', 0)).toBe(0);
    expect(floatOr('2.0/4', 0)).toBe(0);
  });

  it('should use fallback for ".", ".0", ".5"', (): void => {
    expect(floatOr('.', 99)).toBe(99);
    expect(floatOr('.0', 99)).toBe(99);
    expect(floatOr('.5', 99)).toBe(99);
  });

  it('should use fallback for "0.", "2."', (): void => {
    expect(floatOr('0.', 99)).toBe(99);
    expect(floatOr('2.', 99)).toBe(99);
  });
});

describe('floatOr (loose)', (): void => {
  it('should accept "2", "02", "002", "30"', (): void => {
    expect(floatOr('2', 0, true)).toBe(2);
    expect(floatOr('02', 0, true)).toBe(2);
    expect(floatOr('002', 0, true)).toBe(2);
    expect(floatOr('30', 0, true)).toBe(30);
  });

  it('should accept "2.5", "02.5", "002.50", "30.500"', (): void => {
    expect(floatOr('2.5', 0, true)).toBe(2.5);
    expect(floatOr('02.5', 0, true)).toBe(2.5);
    expect(floatOr('002.50', 0, true)).toBe(2.5);
    expect(floatOr('30.500', 0, true)).toBe(30.5);
  });

  it('should accept "2.0.", "2.0/4"', (): void => {
    expect(floatOr('2.0.', 0, true)).toBe(2);
    expect(floatOr('2.0/4', 0, true)).toBe(2);
  });

  it('should accept "0.", "2."', (): void => {
    expect(floatOr('0.', 99, true)).toBe(0);
    expect(floatOr('2.', 99, true)).toBe(2);
  });

  it('should use fallback for "", null and undefined', (): void => {
    expect(floatOr('', 0, true)).toBe(0);
    expect(floatOr(null, 0, true)).toBe(0);
    expect(floatOr(undefined, 0, true)).toBe(0);
  });

  it('should use fallback for ".", "0.", ".0", "2.", ".5"', (): void => {
    expect(floatOr('.', 99, true)).toBe(99);
    expect(floatOr('.0', 99, true)).toBe(99);
    expect(floatOr('.5', 99, true)).toBe(99);
  });
});
