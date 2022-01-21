import { describe, expect, it } from 'vitest';
import { encodeBase32 } from '../src/base32';

describe('base32', () => {
  describe('encode', () => {
    it('should return "ehin6t10cdnm8p9e" for "test code."', () => {
      expect(encodeBase32(Buffer.from('test code.', 'utf-8'))).toBe(
        'ehin6t10cdnm8p9e'
      );
    });

    it('should return "00000000" for 0x0000000000', () => {
      expect(encodeBase32(Buffer.from('0000000000', 'hex'))).toBe('00000000');
    });

    it('should return "vvvvvvvv" for 0xffffffffff', () => {
      expect(encodeBase32(Buffer.from('ffffffffff', 'hex'))).toBe('vvvvvvvv');
    });

    it('should return "" for ""', () => {
      expect(encodeBase32(Buffer.from('', 'utf-8'))).toBe('');
    });

    it('should return "c4" for "a"', () => {
      expect(encodeBase32(Buffer.from('a', 'utf-8'))).toBe('c4');
    });

    it('should return "c5h0" for "ab"', () => {
      expect(encodeBase32(Buffer.from('ab', 'utf-8'))).toBe('c5h0');
    });

    it('should return "c5h66" for "abc"', () => {
      expect(encodeBase32(Buffer.from('abc', 'utf-8'))).toBe('c5h66');
    });

    it('should return "c5h66p0" for "abcd"', () => {
      expect(encodeBase32(Buffer.from('abcd', 'utf-8'))).toBe('c5h66p0');
    });

    it('should return "c5h66p35" for "abcde"', () => {
      expect(encodeBase32(Buffer.from('abcde', 'utf-8'))).toBe('c5h66p35');
    });

    it('should return "c5h66p35co" for "abcdef"', () => {
      expect(encodeBase32(Buffer.from('abcdef', 'utf-8'))).toBe('c5h66p35co');
    });
  });
});
