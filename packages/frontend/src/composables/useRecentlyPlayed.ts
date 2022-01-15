import type { Ref } from 'vue';
import { RECENTLY_PLAYED_MAX_ENTRIES } from '~/config';
import { useTrackFilter } from './useTrackFilter';

interface RecentlyPlayedItem {
  id: string;
  at: number;
}

function _useRecentlyPlayed() {
  const { doesTrackExist$$q, isTrackAvailable$$q, serializedFilterKey$$q } =
    useTrackFilter();
  const store = useLocalStorage<RecentlyPlayedItem[]>('recentlyPlayed', []);

  const filterAndAdd = (trackId?: string) => {
    if (trackId != null && !doesTrackExist$$q(trackId)) {
      trackId = undefined;
    }

    store.value = [
      ...(trackId ? [{ id: trackId, at: Date.now() }] : []),
      ...store.value
        .filter((item) => item.id !== trackId && doesTrackExist$$q(item.id))
        .slice(0, RECENTLY_PLAYED_MAX_ENTRIES - (trackId ? 1 : 0)),
    ];
  };

  watch(serializedFilterKey$$q, () => {
    filterAndAdd();
  });

  return {
    tracks$$q: store as Readonly<Ref<readonly RecentlyPlayedItem[]>>,
    addRecentlyPlayedTrack$$q: (trackId: string): void => {
      if (!isTrackAvailable$$q(trackId)) {
        return;
      }
      filterAndAdd(trackId);
    },
  };
}

export const useRecentlyPlayed = createSharedComposable(_useRecentlyPlayed);
