<script lang="ts">
import { SwipeDirection } from '@vueuse/core';
import { useCurrentTrackInfo } from '~/composables';
import { SWIPE_DISTANCE_THRESHOLD } from '~/config';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();
    const { value: currentTrackInfo } = useCurrentTrackInfo();

    const container$$q = ref<HTMLElement | null | undefined>();
    const containerWidth = computed(() => container$$q.value?.offsetWidth);
    const { lengthX } = useSwipe(container$$q, {
      passive: true,
      onSwipeEnd(_e: TouchEvent, direction: SwipeDirection) {
        const trigger =
          containerWidth.value &&
          Math.abs(lengthX.value) / containerWidth.value >=
            SWIPE_DISTANCE_THRESHOLD;
        if (!trigger) {
          return;
        }

        switch (direction) {
          case SwipeDirection.LEFT:
            playbackStore.skipNext$$q();
            break;

          case SwipeDirection.RIGHT:
            playbackStore.goPrevious$$q();
            break;
        }
      },
    });

    return {
      container$$q,
      currentTrackInfo$$q: currentTrackInfo,
      playing$$q: playbackStore.playing$$q,
      position$$q: playbackStore.position$$q,
      duration$$q: playbackStore.duration$$q,
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
    <div
      ref="container$$q"
      class="w-full flex-1 flex flex-row px-4 items-center"
    >
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
    <SSliderIndicator
      class="flex-none w-full h-1"
      :model-value="position$$q"
      :max="duration$$q"
    />
  </VSheet>
</template>
