import { join } from 'node:path';
import { nfsTempDir, tempDir } from './config.js';

export function getTempFilepath(filename: string): string {
  return join(tempDir, filename);
}

export function getNFSTempFilepath(filename: string): string {
  return join(nfsTempDir, filename);
}
