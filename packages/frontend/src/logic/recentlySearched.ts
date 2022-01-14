import type { Ref } from 'vue';
import { RECENTLY_SEARCHED_MAX_ENTRIES } from '~/config';

interface RecentlySearchedItem {
  query: string;
  at: number;
}

function _useRecentlySearched() {
  const store = useLocalStorage<RecentlySearchedItem[]>('recentlySearched', []);

  const filterAndAdd = (query?: string) => {
    store.value = [
      ...(query ? [{ query, at: Date.now() }] : []),
      ...store.value
        .filter((item) => item.query !== query)
        .slice(0, RECENTLY_SEARCHED_MAX_ENTRIES - (query ? 1 : 0)),
    ];
  };

  return {
    queries$$q: store as Readonly<Ref<readonly RecentlySearchedItem[]>>,
    removeRecentlySearchedQuery$$q: (query: string): void => {
      store.value = store.value.filter((item) => item.query !== query);
    },
    addRecentlySearchedQuery$$q: (query: string): void => {
      filterAndAdd(query);
    },
  };
}

export const useRecentlySearched = createSharedComposable(_useRecentlySearched);
