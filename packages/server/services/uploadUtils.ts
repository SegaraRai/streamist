import {
  MULTIPART_UPLOAD_MIN_CHUNK_SIZE,
  MULTIPART_UPLOAD_THRESHOLD,
} from '$/config';

export function useMultipartUpload(size: number): boolean {
  return size > MULTIPART_UPLOAD_THRESHOLD;
}

export function splitIntoParts(size: number): number[] {
  if (size <= MULTIPART_UPLOAD_THRESHOLD) {
    return [size];
  }

  if (size <= MULTIPART_UPLOAD_MIN_CHUNK_SIZE) {
    return [size];
  }

  const parts = new Array<number>(
    Math.floor(size / MULTIPART_UPLOAD_MIN_CHUNK_SIZE)
  ).fill(MULTIPART_UPLOAD_MIN_CHUNK_SIZE);

  parts[parts.length - 1] += size % MULTIPART_UPLOAD_MIN_CHUNK_SIZE;

  return parts;
}
