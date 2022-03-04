<script lang="ts">
import { useAccurateTime } from '~/composables/useAccurateTime';
import { useWS } from '~/composables/useWS';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  setup() {
    usePlaybackStore();
    useWS();
    useAccurateTime();

    return {};
  },
});
</script>

<template>
  <slot></slot>
</template>
