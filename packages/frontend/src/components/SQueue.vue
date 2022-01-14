<script lang="ts">
import { MIN_QUEUE_SIZE } from '$shared/config/queue';
import type { ResourceTrack } from '$/types';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    scrollTop: {
      type: Number,
      required: true,
    },
  },
  setup() {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    const playNextQueue$$q = eagerComputed(() =>
      playbackStore.playNextQueue$$q.value.map(({ id }) => id)
    );
    const queue$$q = eagerComputed(() =>
      playbackStore.queue$$q.value.slice(0, MIN_QUEUE_SIZE).map(({ id }) => id)
    );

    const play$$q = (index: number): void => {
      playbackStore.skipNext$$q(index + 1);
    };

    return {
      t,
      currentSetListName$$q: playbackStore.currentSetListName$$q,
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
  <div :class="repeatOne$$q ? 'opacity-60' : ''" class="py-2">
    <!-- TODO: make list draggable -->
    <template v-if="playNextQueue$$q.length">
      <div class="text-lg leading-tight px-2 pb-1 opacity-80">
        {{ t('queue.NextInQueue') }}
      </div>
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
    <template v-if="currentSetListName$$q && queue$$q.length">
      <template v-if="playNextQueue$$q.length">
        <div class="h-8"></div>
      </template>
      <div class="text-lg leading-tight px-2 pb-1 opacity-80">
        {{ t('queue.NextFrom', [currentSetListName$$q]) }}
      </div>
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
    </template>
  </div>
</template>
