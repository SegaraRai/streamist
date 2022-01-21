<script lang="ts">
import { MIN_QUEUE_SIZE } from '$shared/config';
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
      removeFromPNQueue$$q: (_track: ResourceTrack, index: number): void => {
        playbackStore.removeTracksFromPlayNextQueue$$q(index);
      },
    };
  },
});
</script>

<template>
  <div :class="repeatOne$$q ? 'opacity-60' : ''" class="py-2">
    <!-- TODO: make list draggable -->
    <template v-if="playNextQueue$$q.length">
      <div class="s-heading-sl text-lg opacity-80 px-2 pb-1">
        {{ t('queue.NextInQueue') }}
      </div>
      <STrackList
        :tracks="playNextQueue$$q"
        render-mode="plain"
        index-content="albumArtwork"
        hide-header
        show-artist
        visit-album
        visit-artist
        disable-current-playing
        removable
        :scroll-top="scrollTop"
        @play="playFromPNQueue$$q"
        @remove="removeFromPNQueue$$q"
      />
    </template>
    <template v-if="currentSetListName$$q && queue$$q.length">
      <template v-if="playNextQueue$$q.length">
        <div class="h-8"></div>
      </template>
      <div class="s-heading-sl text-lg opacity-80 px-2 pb-1">
        {{ t('queue.NextFrom', [currentSetListName$$q]) }}
      </div>
      <STrackList
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
