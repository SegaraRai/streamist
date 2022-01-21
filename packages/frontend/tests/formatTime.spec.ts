import { describe, expect, it } from 'vitest';
import { formatTime } from '~/logic/formatTime';

describe('formatTime', () => {
  it('should throw error if value is less than 0', () => {
    expect(() => formatTime(-1)).toThrowErrorMatchingSnapshot();
  });

  it('should throw error if max is less than 0', () => {
    expect(() => formatTime(0, -1)).toThrowErrorMatchingSnapshot();
  });

  it('should throw error if max is less than value', () => {
    expect(() => formatTime(1, 0)).toThrowErrorMatchingSnapshot();
  });

  it('should return 0:00 for 0 (max < 600)', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(0, 0)).toBe('0:00');
    expect(formatTime(0, 599)).toBe('0:00');
  });

  it('should return 00:00 for 0 (600 <= max < 3600)', () => {
    expect(formatTime(0, 600)).toBe('00:00');
    expect(formatTime(0, 3599)).toBe('00:00');
  });

  it('should return 0:00:00 for 0 (3600 <= max < 36000)', () => {
    expect(formatTime(0, 3600)).toBe('0:00:00');
    expect(formatTime(0, 35999)).toBe('0:00:00');
  });

  it('should return 00:00:00 for 0 (36000 <= max < 360000)', () => {
    expect(formatTime(0, 36000)).toBe('00:00:00');
    expect(formatTime(0, 359999)).toBe('00:00:00');
  });

  it('should return 000:00:00 for 0 (360000 <= max < 3600000)', () => {
    expect(formatTime(0, 360000)).toBe('000:00:00');
    expect(formatTime(0, 3599999)).toBe('000:00:00');
  });

  it('should format time correctly', () => {
    expect(formatTime(40)).toBe('0:40');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(80)).toBe('1:20');
    expect(formatTime(700)).toBe('11:40');

    expect(formatTime(40, 500)).toBe('0:40');
    expect(formatTime(60, 500)).toBe('1:00');
    expect(formatTime(80, 500)).toBe('1:20');

    expect(formatTime(40, 900)).toBe('00:40');
    expect(formatTime(60, 900)).toBe('01:00');
    expect(formatTime(80, 900)).toBe('01:20');
    expect(formatTime(700, 900)).toBe('11:40');
  });
});
