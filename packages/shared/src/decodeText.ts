import { detect } from 'chardet';
import { decode, encodingExists } from 'iconv-lite';

export function decodeText(buffer: Uint8Array): string {
  const encoding = detect(buffer);
  if (!encoding) {
    throw new Error('unknown encoding');
  }
  if (!encodingExists(encoding)) {
    throw new Error(`unsupported encoding: ${encoding}`);
  }
  // TODO: remove @ts-ignore comment when new version of iconv-lite is released
  // @ts-ignore
  return decode(buffer, encoding);
}
