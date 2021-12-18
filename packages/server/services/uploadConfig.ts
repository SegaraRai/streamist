export const MULTIPART_UPLOAD_THRESHOLD = -1; // all

// this must be larger than 5MiB
// c.f. https://wasabi-support.zendesk.com/hc/en-us/articles/360033859411-How-do-I-clean-up-my-failed-multipart-uploads-
export const MULTIPART_UPLOAD_MIN_CHUNK_SIZE = 8 * 1024 * 1024; // 8MiB

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
