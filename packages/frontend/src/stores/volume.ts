import { throttleFilter } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { MAX_VOLUME, MIN_UNMUTED_VOLUME, MIN_VOLUME } from '$shared/config';
import { VOLUME_SYNC_THROTTLE } from '~/config';

function normalize(volume: number): number {
  return Math.max(Math.min(Math.round(volume), MAX_VOLUME), MIN_VOLUME);
}

const createSerializer = (minVolume = MIN_VOLUME) => ({
  read: (strVolume: string | null | undefined): number => {
    const volume = strVolume ? parseInt(strVolume, 10) : MAX_VOLUME;
    return isFinite(volume)
      ? Math.max(normalize(volume), minVolume)
      : MAX_VOLUME;
  },
  write: (volume: number): string => {
    return Math.max(normalize(volume), minVolume).toString();
  },
});

export const useVolumeStore = defineStore('volume', () => {
  const volume = useLocalStorage('playback.volume', MAX_VOLUME, {
    serializer: createSerializer(),
    eventFilter: throttleFilter(VOLUME_SYNC_THROTTLE),
  });
  const unmutedVolume = useLocalStorage('playback.volumeUnmuted', MAX_VOLUME, {
    serializer: createSerializer(MIN_UNMUTED_VOLUME),
    eventFilter: throttleFilter(VOLUME_SYNC_THROTTLE),
  });

  return {
    volume: computed<number>({
      get(): number {
        return volume.value;
      },
      set(value: number): void {
        const normalizedValue = normalize(value);
        if (normalizedValue > MIN_VOLUME) {
          unmutedVolume.value = Math.max(normalizedValue, MIN_UNMUTED_VOLUME);
        }
        volume.value = normalizedValue;
      },
    }),
    setDraggingVolume: (value: number): void => {
      const normalizedValue = normalize(value);
      if (normalizedValue === volume.value) {
        return;
      }
      volume.value = normalizedValue;
    },
    muted: computed<boolean>({
      get(): boolean {
        return volume.value === MIN_VOLUME;
      },
      set(value: boolean): void {
        if (value) {
          unmutedVolume.value = Math.max(volume.value, MIN_UNMUTED_VOLUME);
          volume.value = MIN_VOLUME;
        } else {
          volume.value = unmutedVolume.value;
        }
      },
    }),
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVolumeStore, import.meta.hot));
}
