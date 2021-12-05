import { join } from 'node:path';
import { nfsTempDir, tempDir } from './config.js';

let gCounter = 0;

export function generateTempFilename(): string {
  return `${process.pid}-${Date.now()}-${++gCounter}-${Math.random()
    .toFixed(8)
    .replace(/\./g, '')}`;
}

export function getTempFilepath(filename: string): string {
  return join(tempDir, filename);
}

export function getNFSTempFilepath(filename: string): string {
  return join(nfsTempDir, filename);
}
