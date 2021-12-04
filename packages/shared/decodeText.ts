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
  return decode(buffer, encoding);
}
