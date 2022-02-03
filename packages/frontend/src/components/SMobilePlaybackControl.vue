<script lang="ts">
import { useCurrentTrackInfo } from '~/composables';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();

    const { value: currentTrackInfo } = useCurrentTrackInfo();

    return {
      currentTrackInfo$$q: currentTrackInfo,
      playing$$q: playbackStore.playing$$q,
      progress$$q: computed(() =>
        playbackStore.position$$q.value && playbackStore.duration$$q.value
          ? (playbackStore.position$$q.value /
              playbackStore.duration$$q.value) *
            100
          : 0
      ),
      play$$q: (): void => {
        playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
      },
      preventXButton$$q: (event: MouseEvent): void => {
        if (event.button === 3 || event.button === 4) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      onMouseUp$$q: (event: MouseEvent): void => {
        switch (event.button) {
          // browser back
          case 3:
            playbackStore.goPrevious$$q();
            break;

          // browser forward
          case 4:
            playbackStore.skipNext$$q();
            break;
        }
      },
    };
  },
});
</script>

<template>
  <VSheet
    class="flex-1 w-full h-full flex flex-col m-0 p-0! select-none"
    @click="preventXButton$$q"
    @mousedown="preventXButton$$q"
    @mouseup="preventXButton$$q($event), onMouseUp$$q($event)"
  >
    <div class="w-full flex-1 flex flex-row px-4 items-center">
      <RouterLink
        class="flex-1 flex items-center overflow-hidden"
        to="/playing"
      >
        <template v-if="currentTrackInfo$$q">
          <SPlaybackTrackView
            :track="currentTrackInfo$$q.track$$q"
            :artist-name="currentTrackInfo$$q.trackArtist$$q.name"
            navigate-playing
          />
        </template>
      </RouterLink>
      <div class="flex-none items-center">
        <!-- TODO: implement vertical volume control -->
        <VBtn flat icon @click="play$$q">
          <VIcon>
            {{ playing$$q ? 'mdi-pause' : 'mdi-play' }}
          </VIcon>
        </VBtn>
      </div>
    </div>
    <VProgressLinear
      class="flex-none w-full"
      :model-value="progress$$q"
      color="primary"
      rounded
      rounded-bar
    />
  </VSheet>
</template>
