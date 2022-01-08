<script lang="ts">
import type { ResourceTrack } from '$/types';
import { minQueueSize } from '~/config/queue';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    scrollTop: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const playbackStore = usePlaybackStore();
    const { playNextQueue$$q } = playbackStore;
    const queue$$q = eagerComputed(() =>
      playbackStore.queue$$q.value.slice(0, minQueueSize)
    );

    const play$$q = (index: number): void => {
      playbackStore.skipNext$$q(index + 1);
    };

    return {
      repeatOne$$q: eagerComputed(
        () => playbackStore.repeat$$q.value === 'one'
      ),
      playNextQueue$$q,
      queue$$q,
      playFromPNQueue$$q: (_track: ResourceTrack, index: number): void => {
        play$$q(index);
      },
      playFromQueue$$q: (_track: ResourceTrack, index: number): void => {
        play$$q(playNextQueue$$q.value.length + index);
      },
    };
  },
});
</script>

<template>
  <div :class="repeatOne$$q ? 'opacity-50' : ''">
    <!-- TODO: make list draggable -->
    <!-- we have to use plain render mode as virtual render mode is not reactive for tracks -->
    <template v-if="playNextQueue$$q.length">
      <s-track-list
        :tracks="playNextQueue$$q"
        render-mode="plain"
        index-content="albumArtwork"
        hide-header
        show-artist
        visit-album
        visit-artist
        disable-current-playing
        :scroll-top="scrollTop"
        @play="playFromPNQueue$$q"
      />
    </template>
    <s-track-list
      :tracks="queue$$q"
      render-mode="plain"
      index-content="albumArtwork"
      hide-header
      show-artist
      visit-album
      visit-artist
      disable-current-playing
      :scroll-top="scrollTop"
      @play="playFromQueue$$q"
    />
  </div>
</template>
