import { join } from 'node:path';
import { tempDir } from './config';

export function getTempFilepath(filename: string): string {
  return join(tempDir, filename);
}
