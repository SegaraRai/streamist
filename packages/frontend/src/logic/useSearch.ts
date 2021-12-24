import type { ComputedRef, Ref } from 'vue';
import { useAllArtists } from './useDB';

type SearchItem<T> = { readonly key: string; readonly item: T };

function createSearch<T>(
  items: Readonly<Ref<readonly SearchItem<T>[]>>
): ComputedRef<(term: string) => T[]> {
  return computed((): ((term: string) => T[]) => {
    const index = items.value.map((item: SearchItem<T>) => ({
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
      artists.value.value?.map((artist) => ({
        key: artist.name,
        item: artist,
      })) || []
  );
  return createSearch(items);
}

export const useArtistSearch = createSharedComposable(_useArtistSearch);
