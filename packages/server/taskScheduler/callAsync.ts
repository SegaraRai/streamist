export function callAsync<T>(callback: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const result = callback();
      if (result instanceof Promise) {
        result.then(resolve, reject);
      } else {
        resolve(result);
      }
    } catch (error) {
      reject(error);
    }
  });
}
