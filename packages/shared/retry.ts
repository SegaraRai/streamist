import { RETRY_WAITS_S3, RETRY_WAITS_UPLOAD } from './config';
import { sleep } from './sleep';

export async function retry<T>(
  func: (count: number) => Promise<T>,
  waits: readonly number[]
): Promise<T> {
  let error: unknown;
  for (let count = 0; count <= waits.length; count++) {
    if (count > 0) {
      const wait = waits[count - 1];
      await sleep(wait);
    }
    try {
      return await func(count);
    } catch (e) {
      error = e;
    }
  }
  return Promise.reject(error);
}

export const retryS3 = <T>(func: () => Promise<T>): Promise<T> =>
  retry<T>(func, RETRY_WAITS_S3);

export const retryS3NoReject = <T>(
  func: () => Promise<T>
): Promise<T | undefined> =>
  retry<T>(func, RETRY_WAITS_S3).catch(() => undefined);

export const retryUpload = <T>(func: () => Promise<T>): Promise<T> =>
  retry<T>(func, RETRY_WAITS_UPLOAD);
