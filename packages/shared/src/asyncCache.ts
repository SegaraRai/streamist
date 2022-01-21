export interface AsyncCache<T> {
  value: T | undefined;
  valueAsync: Promise<T>;
  readonly renewing: boolean;
  // same as reading valueAsync (if force is false or omitted), but this is needed to prevent optimizer from removing it
  readonly renew: (force?: boolean) => Promise<T>;
  readonly clear: () => void;
}

export function createAsyncCache<T>(
  renew: () => Promise<T>,
  isValid: (value: T) => boolean,
  shouldRenew: (value: T) => boolean = () => false,
  initialValue?: T | undefined
): AsyncCache<T> {
  let cacheValue: T | undefined;
  let renewPromise: Promise<T> | undefined;

  const renewInternal = (force = false): Promise<T> => {
    if (!force && cacheValue !== undefined && isValid(cacheValue)) {
      return Promise.resolve(cacheValue);
    }

    if (!renewPromise) {
      renewPromise = renew()
        .then((v): T => (cacheValue = v))
        .finally((): void => {
          renewPromise = undefined;
        });
    }

    return renewPromise;
  };

  if (initialValue !== undefined && isValid(initialValue)) {
    cacheValue = initialValue;
  }

  return {
    get value(): T | undefined {
      if (cacheValue === undefined || !isValid(cacheValue)) {
        renewInternal();
        return;
      }

      if (shouldRenew(cacheValue)) {
        renewInternal(true);
      }
      return cacheValue;
    },
    set value(value: T | undefined) {
      if (value === undefined || !isValid(value)) {
        cacheValue = undefined;
        renewInternal();
        return;
      }

      cacheValue = value;
      if (shouldRenew(value)) {
        renewInternal(true);
      }
    },
    get valueAsync(): Promise<T> {
      return renewInternal(
        cacheValue === undefined ||
          !isValid(cacheValue) ||
          shouldRenew(cacheValue)
      );
    },
    set valueAsync(value: Promise<T>) {
      // NOTE: not handling shouldRenew here
      renewPromise = value
        .then((v): T => (cacheValue = v))
        .finally((): void => {
          renewPromise = undefined;
        });
    },
    get renewing(): boolean {
      return !!renewPromise;
    },
    renew: (force = false): Promise<T> => renewInternal(force),
    clear: (): void => {
      cacheValue = undefined;
      renewPromise = undefined;
    },
  };
}
