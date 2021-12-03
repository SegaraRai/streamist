import { Readable } from 'node:stream';

export function nodeReadableStreamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    if (!(stream instanceof Readable)) {
      throw new TypeError('stream is not a Readable');
    }

    try {
      const buffers: Buffer[] = [];
      let totalLength = 0;

      stream
        .once('error', (err): void => {
          reject(err);
        })
        .once('end', (): void => {
          resolve(Buffer.concat(buffers, totalLength));
        })
        .on('data', (chunk: Buffer): void => {
          buffers.push(chunk);
          totalLength += chunk.length;
        });
    } catch (error: unknown) {
      reject(error);
    }
  });
}
