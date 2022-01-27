export function createPromise<T>(): [
  promise: Promise<T>,
  resolve: (value: T) => void,
  reject: (err: unknown) => void
] {
  let _resolve: (value: T) => void;
  let _reject: (err: unknown) => void;
  const promise = new Promise<T>((resolve, reject): void => {
    _resolve = resolve;
    _reject = reject;
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return [promise, _resolve!, _reject!];
}
