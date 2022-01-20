import { MULTIPART_UPLOAD_MIN_CHUNK_SIZE } from '$/config';

export function splitIntoParts(size: number): number[] {
  if (size <= MULTIPART_UPLOAD_MIN_CHUNK_SIZE) {
    return [size];
  }

  const parts = new Array<number>(
    Math.floor(size / MULTIPART_UPLOAD_MIN_CHUNK_SIZE)
  ).fill(MULTIPART_UPLOAD_MIN_CHUNK_SIZE);

  parts[parts.length - 1] += size % MULTIPART_UPLOAD_MIN_CHUNK_SIZE;

  return parts;
}
