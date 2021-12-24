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

      console.log('useLiveQuery: unsubscribed', querier, watchSources, initial);

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
        valueExists.value = true;
        if (initial) {
          initial = false;
          initialResolve?.(val);
        } else {
          valueAsync.value = Promise.resolve(val);
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

export function transformObservableComputed<T, U>(
  itemsRef: ObservableComputed<T>,
  transform: (item: T) => U,
  eager = false
): ObservableComputed<U> {
  const comp = eager ? eagerComputed : computed;

  let transformCache: [T, U] | undefined;
  const memoizedTransform = (item: T): U => {
    if (!transformCache || transformCache[0] !== item) {
      transformCache = [item, transform(item)];
    }
    return transformCache[1];
  };

  return {
    value: comp((): U | undefined =>
      itemsRef.value.value !== undefined
        ? memoizedTransform(itemsRef.value.value)
        : undefined
    ),
    valueAsync: comp(
      (): Promise<U> => itemsRef.valueAsync.value.then(memoizedTransform)
    ),
    valueExists: itemsRef.valueExists,
  };
}
