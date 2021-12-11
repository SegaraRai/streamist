import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export function calcFileHash(
  filepath: string,
  algorithm: string
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const hash = createHash(algorithm);

      createReadStream(filepath)
        .once('error', reject)
        .once('close', () => {
          resolve(hash.digest('hex'));
        })
        .on('data', (chunk) => {
          hash.update(chunk);
        });
    } catch (error) {
      reject(error);
    }
  });
}
