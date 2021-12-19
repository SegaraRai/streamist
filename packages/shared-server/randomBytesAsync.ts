import { randomBytes } from 'node:crypto';

export function randomBytesAsync(size: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    randomBytes(size, (error, buffer) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(buffer);
    });
  });
}
