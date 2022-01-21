import {
  brotliCompress,
  brotliDecompress,
  deflate,
  gunzip,
  gzip,
  inflate,
} from 'node:zlib';

function createCallback<T, U>(
  resolve: (result: T) => void,
  reject: (error: U) => void
): (error: U, result: T) => void {
  return (error: U, result: T): void => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  };
}

export function gunzipAsync(content: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    gunzip(content, createCallback(resolve, reject));
  });
}

export function gzipAsync(content: Buffer, level = 9): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    gzip(
      content,
      {
        level,
      },
      createCallback(resolve, reject)
    );
  });
}

export function inflateAsync(content: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    inflate(content, createCallback(resolve, reject));
  });
}

export function deflateAsync(content: Buffer, level = 9): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    deflate(
      content,
      {
        level,
      },
      createCallback(resolve, reject)
    );
  });
}

export function brotliDecompressAsync(content: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    brotliDecompress(content, createCallback(resolve, reject));
  });
}

export function brotliCompressAsync(content: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject): void => {
    brotliCompress(content, createCallback(resolve, reject));
  });
}
