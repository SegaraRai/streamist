<script lang="ts">
import { usePlaybackStore } from '~/stores/playback';
import { usePreferenceStore } from '~/stores/preference';

export default defineComponent({
  setup() {
    const preferenceStore = usePreferenceStore();
    const playbackStore = usePlaybackStore();

    useEventListener('beforeunload', (event) => {
      let preventLeave = false;
      switch (preferenceStore.confirmOnLeave) {
        case 'always':
          preventLeave = true;
          break;

        case 'whenPlaying':
          preventLeave = playbackStore.playing$$q.value;
          break;
      }

      if (preventLeave) {
        event.preventDefault();
        event.returnValue = '';
      }
    });

    return {};
  },
});
</script>

<template>
  <slot></slot>
</template>
