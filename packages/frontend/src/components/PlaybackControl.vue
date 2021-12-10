<script lang="ts">
import { computed, defineComponent } from 'vue';
import type { RepeatType } from '$shared/types/playback';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { findAncestor } from '@/logic/findAncestor';
import { formatTime } from '@/logic/formatTime';
import { usePlaybackStore } from '@/stores/playback';
import type { ImageWithFile } from '~/types/image';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();

    const currentTrack = playbackStore.currentTrack$$q;
    const repeatEnabled = computed(
      () => playbackStore.repeat$$q.value !== 'off'
    );
    const shuffleEnabled = playbackStore.shuffle$$q;

    const image = computed<ImageWithFile | null | undefined>(
      () => currentTrack.value && getDefaultAlbumImage(currentTrack.value.album)
    );

    const positionDisplay = computed((): string | undefined => {
      return playbackStore.position$$q.value != null &&
        playbackStore.duration$$q.value != null
        ? formatTime(
            playbackStore.position$$q.value,
            playbackStore.duration$$q.value
          )
        : undefined;
    });

    const durationDisplay = computed((): string | undefined => {
      return playbackStore.duration$$q.value != null
        ? formatTime(playbackStore.duration$$q.value)
        : undefined;
    });

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
      positionDisplay$$q: positionDisplay,
      durationDisplay$$q: durationDisplay,
      position$$q: playbackStore.position$$q,
      duration$$q: playbackStore.duration$$q,
      blurButton$$q: blurButton,
      switchRepeat$$q: switchRepeat,
      switchShuffle$$q: switchShuffle,
      seekTo$$q: (position: number): void => {
        console.log(position);
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
        <div class="albumart-container flex-grow-0">
          <nullable-image
            :image="image$$q"
            :width="imageSize$$q"
            :height="imageSize$$q"
            :aspect-ratio="1"
          />
        </div>
        <!-- pb-1で気持ち上に持ち上げる -->
        <div
          class="album-info-container flex-grow-1 pl-4 pb-1 d-flex flex-column"
        >
          <div class="album-title flex-grow-0 subtitle-1">
            {{ currentTrack$$q.title }}
          </div>
          <div class="album-artist flex-grow-0 subtitle-2">
            {{ currentTrack$$q.artist.name }}
          </div>
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
          <v-icon :color="shuffleEnabled$$q ? 'primary' : ''">{{
            shuffleEnabled$$q ? 'mdi-shuffle' : 'mdi-shuffle-disabled'
          }}</v-icon>
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
          <v-icon>{{ playing$$q ? 'mdi-pause' : 'mdi-play' }}</v-icon>
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
          <v-icon :color="repeatEnabled$$q ? 'primary' : ''">{{
            repeatIcon$$q
          }}</v-icon>
        </v-btn>
      </div>
      <div class="seekbar-container pt-3 d-flex flex-row justify-center">
        <div
          class="duration-left body-2 flex-grow-0 d-flex flex-column justify-center"
        >
          {{ positionDisplay$$q }}
        </div>
        <div class="seekbar px-4 flex-grow-1 d-flex flex-column justify-center">
          <s-seek-bar :current-time="position$$q" :duration="duration$$q" />
        </div>
        <div
          class="duration-right body-2 flex-grow-0 d-flex flex-column justify-center"
        >
          {{ durationDisplay$$q }}
        </div>
      </div>
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

.album-info-container {
  overflow: hidden;
}

.album-title,
.album-artist {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.duration-left,
.duration-right {
  font-family: 'Open Sans', monospace !important;
  font-variant-numeric: slashed-zero lining-nums tabular-nums;
  width: 4em;
  height: 1em;
  line-height: 1;
  user-select: none;
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
