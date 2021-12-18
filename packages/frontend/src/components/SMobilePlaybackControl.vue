<script lang="ts">
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { usePlaybackStore } from '@/stores/playback';
import type { ResourceImage } from '$/types';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();

    const currentTrack = playbackStore.currentTrack$$q;

    const image = computed<ResourceImage | null | undefined>(
      () => currentTrack.value && getDefaultAlbumImage(currentTrack.value.album)
    );

    return {
      currentTrack$$q: currentTrack,
      playing$$q: playbackStore.playing$$q,
      image$$q: image,
      imageSize$$q: 70,
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
            playbackStore.skipPrevious$$q.value();
            break;

          // browser forward
          case 4:
            playbackStore.skipNext$$q.value();
            break;
        }
      },
    };
  },
});
</script>

<template>
  <v-sheet
    class="flex-1 w-full h-full flex flex-col m-0 p-0!"
    @click="preventXButton$$q"
    @mousedown="preventXButton$$q"
    @mouseup="preventXButton$$q($event), onMouseUp$$q($event)"
  >
    <div class="flex-1 flex flex-row px-4 items-center">
      <div class="flex-1 flex flex-row items-center">
        <template v-if="currentTrack$$q">
          <router-link class="block" :to="`/albums/${currentTrack$$q.albumId}`">
            <s-nullable-image
              icon-size="40px"
              :image="image$$q"
              :width="imageSize$$q"
              :height="imageSize$$q"
              :aspect-ratio="1"
            />
          </router-link>
          <!-- pb-1で気持ち上に持ち上げる -->
          <div class="overflow-hidden flex-grow-1 pl-4 pb-1 flex flex-col">
            <router-link
              class="max-w-max whitespace-pre overflow-hidden overflow-ellipsis subtitle-1"
              :to="`/albums/${currentTrack$$q.albumId}`"
            >
              {{ currentTrack$$q.title }}
            </router-link>
            <router-link
              class="max-w-max whitespace-pre overflow-hidden overflow-ellipsis subtitle-2"
              :to="`/artists/${currentTrack$$q.artistId}`"
            >
              {{ currentTrack$$q.artist.name }}
            </router-link>
          </div>
        </template>
      </div>
      <div class="flex-none items-center">
        <!-- TODO: implement vertical volume control -->
        <v-btn flat icon @click="play$$q">
          <v-icon>
            {{ playing$$q ? 'mdi-pause' : 'mdi-play' }}
          </v-icon>
        </v-btn>
      </div>
    </div>
    <v-progress-linear
      class="flex-none w-full"
      :model-value="progress$$q"
      color="primary"
      rounded
      rounded-bar
    />
  </v-sheet>
</template>
