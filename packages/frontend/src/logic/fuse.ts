import Fuse from 'fuse.js';
import type { Ref } from 'vue';

export function createFuse<T>(
  items: Readonly<Ref<readonly T[] | undefined>>,
  options: Fuse.IFuseOptions<T>
): Readonly<Ref<Fuse<T>>> {
  return computed(() => {
    return new Fuse(items.value || [], options);
  });
}
