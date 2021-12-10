export function createMultiMap<V, P extends keyof V>(
  items: readonly V[],
  prop: P,
  keys?: readonly V[P][]
): Map<V[P], V[]> {
  if (keys) {
    const map = new Map<V[P], V[]>(keys.map((key) => [key, []]));
    for (const item of items) {
      const key = item[prop];
      map.get(key)?.push(item);
    }
    return map;
  } else {
    const map = new Map<V[P], V[]>();
    for (const item of items) {
      const key = item[prop];
      map.get(key)?.push(item) || map.set(key, [item]);
    }
    return map;
  }
}
