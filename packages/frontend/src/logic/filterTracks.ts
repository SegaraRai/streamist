import type { ResourceUser } from '$/types';
import { useAllTracks } from './useDB';

export function useTrackFilter() {
  const allTracks = useAllTracks();
  const user = useLocalStorage<ResourceUser | undefined>('db.user', undefined);
  const trackIdSet = computed<ReadonlySet<string> | undefined>(() =>
    allTracks.value.value
      ? new Set(allTracks.value.value.map((track) => track.id))
      : undefined
  );
  const maxTrackId = eagerComputed<string | null>(
    () => user.value?.maxTrackId || null
  );

  const doesTrackExist = (trackId: string): boolean =>
    !trackIdSet.value || trackIdSet.value.has(trackId);

  const isTrackAvailable = (trackId: string): boolean =>
    doesTrackExist(trackId) &&
    (!maxTrackId.value || trackId <= maxTrackId.value);

  return {
    doesTrackExist$$q: doesTrackExist,
    isTrackAvailable$$q: isTrackAvailable,
  };
}
