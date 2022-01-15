import type { Ref } from 'vue';
import { compareString } from '$shared/sort';
import { useLocalStorageDB } from '~/db';
import { useAllTracks } from './useDB';

function _useTrackFilter() {
  const allTracks = useAllTracks();
  const { dbUser$$q } = useLocalStorageDB();

  const maxTrackId = eagerComputed(() => dbUser$$q.value?.maxTrackId ?? null);

  const trackIds = computed<readonly string[] | undefined>(() =>
    allTracks.value.value
      ?.map((track) => track.id)
      .sort((a, b) => compareString(a, b))
  );
  const trackIdSet = computed<ReadonlySet<string> | undefined>(() =>
    trackIds.value ? new Set(trackIds.value) : undefined
  );

  const serializedFilterKey = computed<string | undefined>(() =>
    dbUser$$q.value && trackIds.value
      ? `${maxTrackId.value}:${trackIds.value.join()}`
      : undefined
  );

  const doesTrackExist = (trackId: string): boolean =>
    !trackIdSet.value || trackIdSet.value.has(trackId);

  const isTrackAvailable = (trackId: string): boolean =>
    doesTrackExist(trackId) &&
    (!maxTrackId.value || trackId <= maxTrackId.value);

  return {
    serializedFilterKey$$q: serializedFilterKey as Readonly<Ref<string>>,
    doesTrackExist$$q: doesTrackExist,
    isTrackAvailable$$q: isTrackAvailable,
  };
}

export const useTrackFilter = _useTrackFilter;
