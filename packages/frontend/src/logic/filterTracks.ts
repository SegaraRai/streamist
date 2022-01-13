import type { Ref } from 'vue';
import type { ResourceUser } from '$/types';
import { useAllTracks } from './useDB';

export function useTrackFilter() {
  const allTracks = useAllTracks();
  const user = useLocalStorage<ResourceUser | undefined>('db.user', undefined, {
    serializer: {
      read: (v: any) => (v ? JSON.parse(v) : undefined),
      write: (v: any) => (v ? JSON.stringify(v) : ''),
    },
  });
  const trackIds = computed<readonly string[] | undefined>(() =>
    allTracks.value.value?.map((track) => track.id)
  );
  const trackIdSet = computed<ReadonlySet<string> | undefined>(() =>
    trackIds.value ? new Set(trackIds.value) : undefined
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
    trackIds$$q: trackIds as Readonly<Ref<readonly string[] | undefined>>,
    doesTrackExist$$q: doesTrackExist,
    isTrackAvailable$$q: isTrackAvailable,
  };
}
