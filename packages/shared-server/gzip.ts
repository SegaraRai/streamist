import { gunzip, gzip } from 'node:zlib';

function createCallback<T, U>(
  resolve: (result: T) => void,
  reject: (error: U) => void
): (error: U, result: T) => void {
  return (error: U, result: T) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  };
}

export function gunzipAsync(content: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    gunzip(content, createCallback(resolve, reject));
  });
}

export function gzipAsync(content: Buffer, level = 9): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    gzip(
      content,
      {
        level,
      },
      createCallback(resolve, reject)
    );
  });
}
