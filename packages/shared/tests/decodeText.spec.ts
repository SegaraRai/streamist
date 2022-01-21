import { describe, expect, it } from 'vitest';
import { decodeText } from '../src/decodeText';

describe('decodeText', () => {
  describe('decodeText', () => {
    it('should successfully decode unicode texts with BOM', () => {
      // UTF-8
      expect(decodeText(Buffer.from([0xef, 0xbb, 0xbf]))).toBe('');
      expect(decodeText(Buffer.from([0xef, 0xbb, 0xbf, 0x41]))).toBe('A');
      expect(
        decodeText(Buffer.from([0xef, 0xbb, 0xbf, 0xf0, 0x9f, 0x8d, 0xa1]))
      ).toBe('🍡');
      // UTF-16 LE
      expect(decodeText(Buffer.from([0xff, 0xfe]))).toBe('');
      expect(decodeText(Buffer.from([0xff, 0xfe, 0x41, 0x00]))).toBe('A');
      expect(
        decodeText(Buffer.from([0xff, 0xfe, 0x3c, 0xd8, 0x61, 0xdf]))
      ).toBe('🍡');
      // UTF-16 BE
      expect(decodeText(Buffer.from([0xfe, 0xff]))).toBe('');
      expect(decodeText(Buffer.from([0xfe, 0xff, 0x00, 0x41]))).toBe('A');
      expect(
        decodeText(Buffer.from([0xfe, 0xff, 0xd8, 0x3c, 0xdf, 0x61]))
      ).toBe('🍡');
      // UTF-32 LE
      expect(decodeText(Buffer.from([0xff, 0xfe, 0x00, 0x00]))).toBe('');
      expect(
        decodeText(
          Buffer.from([0xff, 0xfe, 0x00, 0x00, 0x41, 0x00, 0x00, 0x00])
        )
      ).toBe('A');
      expect(
        decodeText(
          Buffer.from([0xff, 0xfe, 0x00, 0x00, 0x61, 0xf3, 0x01, 0x00])
        )
      ).toBe('🍡');
      // UTF-32 BE
      expect(decodeText(Buffer.from([0x00, 0x00, 0xfe, 0xff]))).toBe('');
      expect(
        decodeText(
          Buffer.from([0x00, 0x00, 0xfe, 0xff, 0x00, 0x00, 0x00, 0x41])
        )
      ).toBe('A');
      expect(
        decodeText(
          Buffer.from([0x00, 0x00, 0xfe, 0xff, 0x00, 0x01, 0xf3, 0x61])
        )
      ).toBe('🍡');
    });

    it('should successfully decode long UTF-8 texts', () => {
      // TODO
    });

    it('should successfully decode long Shift_JIS texts', () => {
      // TODO
    });
  });
});
