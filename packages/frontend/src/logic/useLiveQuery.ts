import { Subscription, liveQuery } from 'dexie';
import { Ref, WatchSource } from 'vue';
import { createPromise } from '$shared/promise';

export interface ObservableComputed<T> {
  readonly value: Readonly<Ref<T | undefined>>;
  readonly valueAsync: Readonly<Ref<Promise<T>>>;
  readonly valueExists: Readonly<Ref<boolean>>;
}

export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  watchSources: WatchSource[] = [],
  strict = false
): ObservableComputed<T> {
  let subscription: Subscription | undefined;

  let initial = true;
  let [initialPromise, initialResolve, initialReject] = createPromise<T>();

  const value = ref<T | undefined>();
  const valueAsync = ref<Promise<T>>(initialPromise);
  const valueExists = ref<boolean>(false);

  const update = (): void => {
    if (subscription) {
      subscription.unsubscribe();

      if (initial) {
        initialReject(new Error('operation aborted'));
      }

      initial = true;
      [initialPromise, initialResolve, initialReject] = createPromise<T>();

      valueAsync.value = initialPromise;

      if (strict) {
        value.value = undefined;
        valueExists.value = false;
      }
    }

    subscription = liveQuery<T>(querier).subscribe({
      next: (val): void => {
        value.value = val;
        valueAsync.value = Promise.resolve(val);
        valueExists.value = true;
        if (initial) {
          initial = false;
          initialResolve?.(val);
        }
      },
      error: (err): void => {
        console.warn(err);
        /*
        value.value = undefined;
        valueAsync.value = Promise.reject(err);
        valueExists.value = false;
        //*/
        if (initial) {
          initial = false;
          initialReject?.(err);
        }
      },
    });
  };

  update();

  if (watchSources.length) {
    watch(watchSources, update);
  }

  tryOnScopeDispose((): void => {
    subscription?.unsubscribe();
    subscription = undefined;
  });

  return {
    value,
    valueAsync,
    valueExists,
  };
}
