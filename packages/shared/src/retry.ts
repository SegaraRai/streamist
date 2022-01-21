import {
  RETRY_WAITS_API,
  RETRY_WAITS_S3,
  RETRY_WAITS_TRANSACTION,
  RETRY_WAITS_UPLOAD,
} from './config';
import { sleep } from './sleep';

export async function retry<T>(
  func: (count: number) => Promise<T>,
  waits: readonly number[],
  isNoRetryError?: (error: unknown) => boolean
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
      if (isNoRetryError?.(e)) {
        return Promise.reject(e);
      }
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

export const retryUpload = <T>(
  func: () => Promise<T>,
  isAbortError?: (error: unknown) => boolean
): Promise<T> => retry<T>(func, RETRY_WAITS_UPLOAD, isAbortError);

export const retryAPI = <T>(func: () => Promise<T>): Promise<T> =>
  retry<T>(func, RETRY_WAITS_API);

export const retryTransactionImpl = <T>(func: () => Promise<T>): Promise<T> =>
  retry<T>(func, RETRY_WAITS_TRANSACTION);
