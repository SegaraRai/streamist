import type { ComputedRef, Ref } from 'vue';
import type { ResourceArtist } from '$/types';
import { useAllArtists } from './useDB';

function createSearch<T, U extends { key: string; item: T }>(
  items: Readonly<Ref<readonly U[]>>
): ComputedRef<(term: string) => T[]> {
  return computed((): ((term: string) => T[]) => {
    const index = items.value.map((item: U) => ({
      key: item.key.toLowerCase(),
      item: item.item,
    }));
    return (term: string): T[] => {
      const lcTerm = term.toLowerCase();
      return index
        .filter(({ key }): boolean => key.includes(lcTerm))
        .map(({ item }): T => item);
    };
  });
}

function _useArtistSearch() {
  const artists = useAllArtists();
  const items = computed(
    () =>
      artists.value.value?.map((artist: ResourceArtist) => ({
        key: artist.name,
        item: artist,
      })) || []
  );
  return createSearch(items);
}

export const useArtistSearch = createSharedComposable(_useArtistSearch);
