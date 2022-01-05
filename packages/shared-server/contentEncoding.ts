import { gunzipAsync } from './gzip';

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

    case 'gzip':
      return gunzipAsync(buffer);

    // br, deflate
  }

  throw new Error(
    `decodeBuffer: unsupported Content-Encoding ${contentEncoding}`
  );
}
