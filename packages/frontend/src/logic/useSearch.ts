import Fuse from 'fuse.js';
import type { Ref } from 'vue';
import { useAllArtists } from './useDB';

function createFuse<T>(
  items: Readonly<Ref<readonly T[] | undefined>>,
  options: Fuse.IFuseOptions<T>
): Readonly<Ref<Fuse<T>>> {
  return computed(() => {
    return new Fuse(items.value || [], options);
  });
}

function _useArtistSearch() {
  const artists = useAllArtists();
  const fuse = createFuse(artists.value, { keys: ['name'] });
  return (term: Readonly<Ref<string>>) =>
    computed(() => fuse.value.search(term.value));
}

export const useArtistSearch = createSharedComposable(_useArtistSearch);
