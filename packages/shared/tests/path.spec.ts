import { describe, expect, it } from 'vitest';
import { getExtension, getFilename, getStem } from '../src/path';

describe('path', () => {
  describe('getExtension', () => {
    it('should return "" for "example" and "path/to/example"', () => {
      expect(getExtension('example')).toBe('');
      expect(getExtension('path/to/example')).toBe('');
      expect(getExtension('/path/to/example')).toBe('');
      expect(getExtension('path\\to\\example')).toBe('');
      expect(getExtension('C:\\path\\to\\example')).toBe('');
    });

    it('should return ".txt" for "example.txt" and "path/to/example.txt"', () => {
      expect(getExtension('example.txt')).toBe('.txt');
      expect(getExtension('path/to/example.txt')).toBe('.txt');
      expect(getExtension('/path/to/example.txt')).toBe('.txt');
      expect(getExtension('path\\to\\example.txt')).toBe('.txt');
      expect(getExtension('C:\\path\\to\\example.txt')).toBe('.txt');
    });

    it('should return ".xz" for "example.tar.xz" and "path/to/example.tar.xz"', () => {
      expect(getExtension('example.tar.xz')).toBe('.xz');
      expect(getExtension('path/to/example.tar.xz')).toBe('.xz');
      expect(getExtension('/path/to/example.tar.xz')).toBe('.xz');
      expect(getExtension('path\\to\\example.tar.xz')).toBe('.xz');
      expect(getExtension('C:\\path\\to\\example.tar.xz')).toBe('.xz');
    });

    it('should return ".gitignore" for ".gitignore" and "path/to/.gitignore"', () => {
      expect(getExtension('.gitignore')).toBe('.gitignore');
      expect(getExtension('path/to/.gitignore')).toBe('.gitignore');
      expect(getExtension('/path/to/.gitignore')).toBe('.gitignore');
      expect(getExtension('path\\to\\.gitignore')).toBe('.gitignore');
      expect(getExtension('C:\\path\\to\\.gitignore')).toBe('.gitignore');
    });

    it('should return "" for ""', () => {
      expect(getExtension('')).toBe('');
    });

    it('should return "" for directories', () => {
      expect(getExtension('/')).toBe('');
      expect(getExtension('/root/')).toBe('');
      expect(getExtension('/path/to/dir/')).toBe('');
      expect(getExtension('path/to/dir/')).toBe('');
      expect(getExtension('C:\\')).toBe('');
      expect(getExtension('C:\\path\\to\\dir\\')).toBe('');
      expect(getExtension('path\\to\\dir\\')).toBe('');
    });
  });

  describe('getFilename', () => {
    it('should return "example" for "example"', () => {
      expect(getFilename('example')).toBe('example');
      expect(getFilename('example.txt')).toBe('example.txt');
      expect(getFilename('example.tar.xz')).toBe('example.tar.xz');
      expect(getFilename('.gitignore')).toBe('.gitignore');
    });

    it('should return "example" for "path/to/example"', () => {
      expect(getFilename('path/to/example')).toBe('example');
      expect(getFilename('path/to/example.txt')).toBe('example.txt');
      expect(getFilename('path/to/example.tar.xz')).toBe('example.tar.xz');
      expect(getFilename('path/to/.gitignore')).toBe('.gitignore');
    });

    it('should return "example" for "/path/to/example"', () => {
      expect(getFilename('/path/to/example')).toBe('example');
      expect(getFilename('/path/to/example.txt')).toBe('example.txt');
      expect(getFilename('/path/to/example.tar.xz')).toBe('example.tar.xz');
      expect(getFilename('/path/to/.gitignore')).toBe('.gitignore');
    });

    it('should return "example" for "path\\to\\example"', () => {
      expect(getFilename('path\\to\\example')).toBe('example');
      expect(getFilename('path\\to\\example.txt')).toBe('example.txt');
      expect(getFilename('path\\to\\example.tar.xz')).toBe('example.tar.xz');
      expect(getFilename('path\\to\\.gitignore')).toBe('.gitignore');
    });

    it('should return "example" for "C:\\path\\to\\example"', () => {
      expect(getFilename('C:\\path\\to\\example')).toBe('example');
      expect(getFilename('C:\\path\\to\\example.txt')).toBe('example.txt');
      expect(getFilename('C:\\path\\to\\example.tar.xz')).toBe(
        'example.tar.xz'
      );
      expect(getFilename('C:\\path\\to\\.gitignore')).toBe('.gitignore');
    });

    it('should return "" for ""', () => {
      expect(getFilename('')).toBe('');
    });

    it('should return "" for directories', () => {
      expect(getFilename('/')).toBe('');
      expect(getFilename('/root/')).toBe('');
      expect(getFilename('/path/to/dir/')).toBe('');
      expect(getFilename('path/to/dir/')).toBe('');
      expect(getFilename('C:\\')).toBe('');
      expect(getFilename('C:\\path\\to\\dir\\')).toBe('');
      expect(getFilename('path\\to\\dir\\')).toBe('');
    });
  });

  describe('getStem', () => {
    it('should return "example" for "example"', () => {
      expect(getStem('example')).toBe('example');
      expect(getStem('path/to/example')).toBe('example');
      expect(getStem('/path/to/example')).toBe('example');
      expect(getStem('path\\to\\example')).toBe('example');
      expect(getStem('C:\\path\\to\\example')).toBe('example');
    });

    it('should return "example" for "example.txt"', () => {
      expect(getStem('example.txt')).toBe('example');
      expect(getStem('path/to/example.txt')).toBe('example');
      expect(getStem('/path/to/example.txt')).toBe('example');
      expect(getStem('path\\to\\example.txt')).toBe('example');
      expect(getStem('C:\\path\\to\\example.txt')).toBe('example');
    });

    it('should return "example.tar" for "example.tar.xz"', () => {
      expect(getStem('example.tar.xz')).toBe('example.tar');
      expect(getStem('path/to/example.tar.xz')).toBe('example.tar');
      expect(getStem('/path/to/example.tar.xz')).toBe('example.tar');
      expect(getStem('path\\to\\example.tar.xz')).toBe('example.tar');
      expect(getStem('C:\\path\\to\\example.tar.xz')).toBe('example.tar');
    });

    it('should return "example.dat" for "example.dat."', () => {
      expect(getStem('example.dat.')).toBe('example.dat');
      expect(getStem('path/to/example.dat.')).toBe('example.dat');
      expect(getStem('/path/to/example.dat.')).toBe('example.dat');
      expect(getStem('path\\to\\example.dat.')).toBe('example.dat');
      expect(getStem('C:\\path\\to\\example.dat.')).toBe('example.dat');
    });

    it('should return "" for ".gitignore"', () => {
      expect(getStem('.gitignore')).toBe('');
      expect(getStem('path/to/.gitignore')).toBe('');
      expect(getStem('/path/to/.gitignore')).toBe('');
      expect(getStem('path\\to\\.gitignore')).toBe('');
      expect(getStem('C:\\path\\to\\.gitignore')).toBe('');
    });

    it('should return "" for ""', () => {
      expect(getStem('')).toBe('');
    });

    it('should return "" for directories', () => {
      expect(getStem('/')).toBe('');
      expect(getStem('/root/')).toBe('');
      expect(getStem('/path/to/dir/')).toBe('');
      expect(getStem('path/to/dir/')).toBe('');
      expect(getStem('C:\\')).toBe('');
      expect(getStem('C:\\path\\to\\dir\\')).toBe('');
      expect(getStem('path\\to\\dir\\')).toBe('');
    });
  });
});
