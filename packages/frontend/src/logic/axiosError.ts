import type { AxiosError } from 'axios';

export function isAxiosError(error: unknown): error is AxiosError {
  return !!(error as AxiosError | undefined)?.isAxiosError;
}
