import { join } from 'node:path';
import { NFS_TEMP_DIR, TEMP_DIR } from './config';

let gCounter = 0;

export function generateTempFilename(): string {
  return `${process.pid}-${Date.now()}-${++gCounter}-${Math.random()
    .toFixed(8)
    .replace(/\./g, '')}`;
}

export function getTempFilepath(filename: string): string {
  return join(TEMP_DIR, filename);
}

export function getNFSTempFilepath(filename: string): string {
  return join(NFS_TEMP_DIR, filename);
}
