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

const S3_RETRY_WAITS = [1000, 2000, 5000] as const;

export const retryS3 = <T>(func: () => Promise<T>): Promise<T> =>
  retry<T>(func, S3_RETRY_WAITS);

export const retryS3NoReject = <T>(
  func: () => Promise<T>
): Promise<T | undefined> =>
  retry<T>(func, S3_RETRY_WAITS).catch(() => undefined);
