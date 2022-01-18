import type { WatchSource } from 'vue';
import { createPromise } from '$shared/promise';

export function waitForChange(
  watchSource: WatchSource,
  timeout?: number
): Promise<void> {
  const [promise, pResolve] = createPromise<void>();

  const scope = effectScope();

  const resolve = (): void => {
    scope.stop();
    pResolve();
  };

  const timer = timeout ? setTimeout(resolve, timeout) : undefined;

  scope.run((): void => {
    watchOnce(watchSource, (): void => {
      timer != null && clearTimeout(timer);
      resolve();
    });
  });

  return promise;
}
