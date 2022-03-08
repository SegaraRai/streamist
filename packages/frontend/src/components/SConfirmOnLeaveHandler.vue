<script lang="ts">
import { useWS } from '~/composables';
import { usePlaybackStore } from '~/stores/playback';
import { usePreferenceStore } from '~/stores/preference';

export default defineComponent({
  setup() {
    const preferenceStore = usePreferenceStore();
    const playbackStore = usePlaybackStore();
    const { sessionType$$q } = useWS();

    useEventListener('beforeunload', (event) => {
      let preventLeave = false;
      switch (preferenceStore.confirmOnLeave) {
        case 'always':
          preventLeave = true;
          break;

        case 'whenPlaying':
          preventLeave =
            sessionType$$q.value === 'host' && playbackStore.playing$$q.value;
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
