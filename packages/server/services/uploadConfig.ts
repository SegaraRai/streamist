export const MULTIPART_UPLOAD_THRESHOLD = 16 * 1024 * 1024; // 16MiB
export const MULTIPART_UPLOAD_MIN_CHUNK_SIZE = 8 * 1024 * 1024; // 8MiB

export function useMultipartUpload(size: number): boolean {
  return size > MULTIPART_UPLOAD_THRESHOLD;
}

export function splitIntoParts(size: number): number[] {
  if (size <= MULTIPART_UPLOAD_THRESHOLD) {
    return [size];
  }

  const parts = new Array<number>(
    Math.floor(size / MULTIPART_UPLOAD_MIN_CHUNK_SIZE)
  ).fill(MULTIPART_UPLOAD_MIN_CHUNK_SIZE);

  parts[parts.length - 1] += size % MULTIPART_UPLOAD_MIN_CHUNK_SIZE;

  return parts;
}
