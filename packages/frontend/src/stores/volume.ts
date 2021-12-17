import { acceptHMRUpdate, defineStore } from 'pinia';

function normalize(volume: number): number {
  return Math.max(Math.min(Math.round(volume), 100), 0);
}

export const useVolumeStore = defineStore('volume', () => {
  const volume = ref(100);
  const unmutedVolume = ref(100);

  return {
    volume: computed<number>({
      get() {
        return volume.value;
      },
      set(value) {
        const normalizedValue = normalize(value);
        if (normalizedValue !== 0) {
          unmutedVolume.value = normalizedValue;
        }
        volume.value = normalizedValue;
      },
    }),
    setDraggingVolume: (value: number) => {
      const normalizedValue = normalize(value);
      if (normalizedValue === volume.value) {
        return;
      }
      volume.value = normalizedValue;
    },
    muted: computed({
      get() {
        return volume.value === 0;
      },
      set(value) {
        if (value) {
          unmutedVolume.value = volume.value;
          volume.value = 0;
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
