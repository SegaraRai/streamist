<script lang="ts">
import type { RepeatType } from '$shared/types';
import { useCurrentTrackInfo } from '~/composables';
import { findAncestor } from '~/logic/findAncestor';
import { usePlaybackStore } from '~/stores/playback';
import { useVolumeStore } from '~/stores/volume';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();
    const volumeStore = useVolumeStore();

    const { value: currentTrackInfo } = useCurrentTrackInfo();

    const repeatEnabled = computed(
      () => playbackStore.repeat$$q.value !== 'off'
    );
    const shuffleEnabled = playbackStore.shuffle$$q;

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
      currentTrackInfo$$q: currentTrackInfo,
      volumeStore$$q: volumeStore,
      playing$$q: playbackStore.playing$$q,
      repeatEnabled$$q: repeatEnabled,
      shuffleEnabled$$q: shuffleEnabled,
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
        playbackStore.skipNext$$q();
      },
      skipPrevious$$q: (): void => {
        playbackStore.skipPrevious$$q();
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
            playbackStore.skipPrevious$$q();
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
  <v-sheet
    class="flex-1 w-full flex flex-row px-8 py-0 select-none"
    @click="preventXButton$$q"
    @mousedown="preventXButton$$q"
    @mouseup="preventXButton$$q($event), onMouseUp$$q($event)"
  >
    <div class="w-20vw xl:w-25vw min-w-50 flex-none flex items-center">
      <template v-if="currentTrackInfo$$q">
        <s-playback-track-view
          :track="currentTrackInfo$$q.track$$q"
          :artist-name="currentTrackInfo$$q.trackArtist$$q.name"
        />
      </template>
    </div>
    <div class="flex-1 flex flex-col justify-center">
      <div class="flex flex-row justify-center px-12">
        <!-- clickではなくmouseupでblurButtonを呼んでいるのはキーで操作されたときにblurしないようにするため -->
        <!-- TODO: クリックされたらpopoverを隠す -->
        <n-popover
          placement="top"
          trigger="hover"
          :delay="1000"
          :show-arrow="false"
        >
          <template #trigger>
            <button
              class="mx-5 rounded-full"
              :class="shuffleEnabled$$q && 'text-shadow'"
              @click="switchShuffle$$q"
              @mouseup="blurButton$$q"
            >
              <v-icon :color="(shuffleEnabled$$q && 'primary') || undefined">
                {{ shuffleEnabled$$q ? 'mdi-shuffle' : 'mdi-shuffle-disabled' }}
              </v-icon>
            </button>
          </template>
          <span>
            {{ shuffleEnabled$$q ? 'Disable shuffle' : 'Enable shuffle' }}
          </span>
        </n-popover>
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
        <!-- TODO: クリックされたらpopoverを隠す -->
        <n-popover
          placement="top"
          trigger="hover"
          :delay="1000"
          :show-arrow="false"
        >
          <template #trigger>
            <button
              class="mx-5 rounded-full"
              :class="repeatEnabled$$q && 'text-shadow'"
              @click="switchRepeat$$q"
              @mouseup="blurButton$$q"
            >
              <v-icon :color="(repeatEnabled$$q && 'primary') || undefined">
                {{ repeatIcon$$q }}
              </v-icon>
            </button>
          </template>
          <span>
            {{
              repeatEnabled$$q
                ? repeatIcon$$q === 'mdi-repeat-once'
                  ? 'Disable repeat'
                  : 'Enable repeat one'
                : 'Enable repeat'
            }}
          </span>
        </n-popover>
      </div>
      <s-seek-bar
        class="pt-2"
        :current-time="position$$q"
        :duration="duration$$q"
        @update="seekTo$$q"
      />
    </div>
    <div
      class="w-20vw xl:w-25vw min-w-50 flex-none flex items-center justify-end"
    >
      <div class="flex-1 max-w-40">
        <s-volume-control
          :volume="volumeStore$$q.volume"
          @mute="volumeStore$$q.muted = !volumeStore$$q.muted"
          @update="volumeStore$$q.volume = $event"
          @dragging="volumeStore$$q.setDraggingVolume($event)"
        />
      </div>
    </div>
  </v-sheet>
</template>
