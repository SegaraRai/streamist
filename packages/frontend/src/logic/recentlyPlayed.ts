import type { Ref } from 'vue';
import { useTrackFilter } from './filterTracks';

interface RecentlyPlayedItem {
  id: string;
  at: number;
}

const MAX_ENTRIES = 10;

function _useRecentlyPlayed() {
  const { doesTrackExist$$q, isTrackAvailable$$q, trackIds$$q } =
    useTrackFilter();
  const store = useLocalStorage<RecentlyPlayedItem[]>('recentlyPlayed', []);

  const filterAndAdd = (trackId?: string) => {
    store.value = [
      ...(trackId ? [{ id: trackId, at: Date.now() }] : []),
      ...store.value
        .filter((item) => item.id !== trackId && doesTrackExist$$q(item.id))
        .slice(0, MAX_ENTRIES - 1),
    ];
  };

  watch(trackIds$$q, () => {
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