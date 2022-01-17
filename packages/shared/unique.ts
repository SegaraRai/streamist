/**
 * remove duplicates from an array, preserving the original order (non-destructive)
 * @param array
 * @returns
 */
export function toUnique<T>(array: readonly T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * remove duplicates from an array, preserving the original order (non-destructive)
 * @param array
 * @returns
 */
export function toUniqueByProp<K extends string, T extends Record<K, unknown>>(
  array: readonly T[],
  key: K
): T[] {
  return Array.from(
    new Map(array.map((item): [T[K], T] => [item[key], item])).values()
  );
}
