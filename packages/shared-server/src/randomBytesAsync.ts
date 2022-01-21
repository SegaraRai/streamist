import { randomBytes } from 'node:crypto';

export function randomBytesAsync(size: number): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    randomBytes(size, (error, buffer): void => {
      if (error) {
        reject(error);
        return;
      }
      resolve(buffer);
    });
  });
}
