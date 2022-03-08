<script lang="ts">
import { useAccurateTime, useWS } from '~/composables';
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
