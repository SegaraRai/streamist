import type Fuse from 'fuse.js';
import type { Ref } from 'vue';

export function useFuse<T>(
  items: Readonly<Ref<readonly T[] | undefined>>,
  options: Fuse.IFuseOptions<T>
): Readonly<Ref<Fuse<T> | undefined>> {
  const FusePromise = import('fuse.js');
  const FuseRef = ref<typeof Fuse | undefined>();
  FusePromise.then((f): void => {
    FuseRef.value = f.default;
  });
  return computed(() =>
    FuseRef.value ? new FuseRef.value(items.value || [], options) : undefined
  );
}
