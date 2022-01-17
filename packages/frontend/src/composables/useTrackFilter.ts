import type { Ref } from 'vue';
import { compareString } from '$/shared/sort';
import { useLocalStorageDB } from '~/db';
import { useAllTracks } from './useDB';

function _useTrackFilter() {
  const allTracks = useAllTracks();
  const { dbMaxTrackId$$q } = useLocalStorageDB();

  const trackIds = computed<readonly string[] | undefined>(() =>
    allTracks.value.value
      ?.map((track) => track.id)
      .sort((a, b) => compareString(a, b))
  );
  const trackIdSet = computed<ReadonlySet<string> | undefined>(() =>
    trackIds.value ? new Set(trackIds.value) : undefined
  );

  const serializedFilterKey = computed<string | undefined>(() =>
    trackIds.value
      ? `${dbMaxTrackId$$q.value}:${trackIds.value.join()}`
      : undefined
  );

  const doesTrackExist = (trackId: string): boolean =>
    !trackIdSet.value || trackIdSet.value.has(trackId);

  const isTrackAvailable = (trackId: string): boolean =>
    doesTrackExist(trackId) &&
    (!dbMaxTrackId$$q.value || trackId <= dbMaxTrackId$$q.value);

  return {
    serializedFilterKey$$q: serializedFilterKey as Readonly<Ref<string>>,
    doesTrackExist$$q: doesTrackExist,
    isTrackAvailable$$q: isTrackAvailable,
  };
}

export const useTrackFilter = _useTrackFilter;
