import { brotliDecompressAsync, gunzipAsync, inflateAsync } from './zlib';

export function decodeBuffer(
  buffer: Buffer,
  contentEncoding?: string | null
): Promise<Buffer> {
  switch (contentEncoding) {
    case '':
    case null:
    case undefined:
    case 'identity':
      return Promise.resolve(buffer);

    case 'br':
      return brotliDecompressAsync(buffer);

    case 'deflate':
      return inflateAsync(buffer);

    case 'gzip':
      return gunzipAsync(buffer);
  }

  throw new Error(
    `decodeBuffer: unsupported Content-Encoding ${contentEncoding}`
  );
}
