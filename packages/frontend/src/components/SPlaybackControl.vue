<script lang="ts">
import { computed, defineComponent } from 'vue';
import type { RepeatType } from '$shared/types/playback';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { findAncestor } from '@/logic/findAncestor';
import { usePlaybackStore } from '@/stores/playback';
import type { ResourceImage } from '$/types';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();

    const currentTrack = playbackStore.currentTrack$$q;
    const repeatEnabled = computed(
      () => playbackStore.repeat$$q.value !== 'off'
    );
    const shuffleEnabled = playbackStore.shuffle$$q;

    const image = computed<ResourceImage | null | undefined>(
      () => currentTrack.value && getDefaultAlbumImage(currentTrack.value.album)
    );

    const repeatIcon = computed((): string => {
      switch (playbackStore.repeat$$q.value) {
        case 'off':
          return 'mdi-repeat-off';

        case 'all':
          return 'mdi-repeat';

        case 'one':
          return 'mdi-repeat-once';
      }
      return '';
    });

    const blurButton = (event: MouseEvent) => {
      const button = findAncestor(
        event.target as HTMLElement | undefined,
        (e) => e.tagName === 'BUTTON'
      );
      button?.blur();
    };

    const switchRepeat = () => {
      const repeatTypes: RepeatType[] = ['off', 'all', 'one'];
      playbackStore.repeat$$q.value =
        repeatTypes[
          (repeatTypes.indexOf(playbackStore.repeat$$q.value) + 1) %
            repeatTypes.length
        ];
    };

    const switchShuffle = () => {
      playbackStore.shuffle$$q.value = !playbackStore.shuffle$$q.value;
    };

    return {
      currentTrack$$q: currentTrack,
      playing$$q: playbackStore.playing$$q,
      repeatEnabled$$q: repeatEnabled,
      shuffleEnabled$$q: shuffleEnabled,
      image$$q: image,
      imageSize$$q: 70,
      repeatIcon$$q: repeatIcon,
      position$$q: playbackStore.position$$q,
      duration$$q: playbackStore.duration$$q,
      blurButton$$q: blurButton,
      switchRepeat$$q: switchRepeat,
      switchShuffle$$q: switchShuffle,
      seekTo$$q: (position: number): void => {
        playbackStore.position$$q.value = position;
      },
      play$$q: (): void => {
        playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
      },
      skipNext$$q: (): void => {
        playbackStore.skipNext$$q.value();
      },
      skipPrevious$$q: (): void => {
        playbackStore.skipPrevious$$q.value();
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
    class="w-full flex flex-row px-8 py-0"
    @click="preventXButton$$q"
    @mousedown="preventXButton$$q"
    @mouseup="preventXButton$$q($event), onMouseUp$$q($event)"
  >
    <div class="left-pane flex-grow-0 d-flex flex-row align-center">
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
        <div class="overflow-hidden flex-grow-1 pl-4 pb-1 d-flex flex-column">
          <router-link
            class="block whitespace-pre overflow-hidden overflow-ellipsis subtitle-1"
            :to="`/albums/${currentTrack$$q.albumId}`"
          >
            {{ currentTrack$$q.title }}
          </router-link>
          <router-link
            class="block whitespace-pre overflow-hidden overflow-ellipsis subtitle-2"
            :to="`/artists/${currentTrack$$q.artistId}`"
          >
            {{ currentTrack$$q.artist.name }}
          </router-link>
        </div>
      </template>
    </div>
    <div class="center-pane flex-grow-1 d-flex flex-column justify-center">
      <div class="buttons d-flex flex-row justify-center px-12">
        <!-- clickではなくmouseupでblutButtonを呼んでいるのはキーで操作されたときにblurしないようにするため -->
        <v-btn
          class="mx-5"
          :class="shuffleEnabled$$q ? 'active-button' : ''"
          flat
          icon
          :ripple="false"
          @click="switchShuffle$$q"
          @mouseup="blurButton$$q"
        >
          <v-icon :color="shuffleEnabled$$q ? 'primary' : ''">
            {{ shuffleEnabled$$q ? 'mdi-shuffle' : 'mdi-shuffle-disabled' }}
          </v-icon>
        </v-btn>
        <v-btn
          class="mx-5"
          flat
          icon
          @click="skipPrevious$$q"
          @mouseup="blurButton$$q"
        >
          <v-icon>mdi-skip-previous</v-icon>
        </v-btn>
        <v-btn class="mx-3" icon @click="play$$q" @mouseup="blurButton$$q">
          <v-icon>
            {{ playing$$q ? 'mdi-pause' : 'mdi-play' }}
          </v-icon>
        </v-btn>
        <v-btn
          flat
          class="mx-5"
          icon
          @click="skipNext$$q"
          @mouseup="blurButton$$q"
        >
          <v-icon>mdi-skip-next</v-icon>
        </v-btn>
        <v-btn
          class="mx-5"
          :class="repeatEnabled$$q ? 'active-button' : ''"
          flat
          icon
          :ripple="false"
          @click="switchRepeat$$q"
          @mouseup="blurButton$$q"
        >
          <v-icon :color="repeatEnabled$$q ? 'primary' : ''">
            {{ repeatIcon$$q }}
          </v-icon>
        </v-btn>
      </div>
      <s-seek-bar
        class="pt-2"
        :current-time="position$$q"
        :duration="duration$$q"
        @update="seekTo$$q"
      />
    </div>
    <div class="right-pane flex-grow-0"></div>
  </v-sheet>
</template>

<style scoped>
.left-pane,
.right-pane {
  width: 20vw;
  min-width: 200px;
}

.duration-left {
  text-align: right;
}

.duration-right {
  text-align: left;
}

.active-button {
  text-shadow: 0 0 1px;
}
</style>
