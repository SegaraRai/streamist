<route lang="yaml">
meta:
  hideShell: true
</route>

<script lang="ts">
import type { RepeatType } from '$shared/types/playback';
import { useCurrentTrackInfo } from '~/logic/currentTrackInfo';
import { findAncestor } from '~/logic/findAncestor';
import { usePlaybackStore } from '~/stores/playback';
import { useVolumeStore } from '~/stores/volume';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const volumeStore = useVolumeStore();

    const { value: currentTrackInfo } = useCurrentTrackInfo();

    useHead({
      title: t('title.Playing.no_track'),
    });

    const title = useTitle();
    watch(
      currentTrackInfo,
      (newTrackInfo) => {
        title.value = newTrackInfo
          ? t('title.Playing.track', [
              newTrackInfo.track$$q.title,
              newTrackInfo.trackArtist$$q.name,
            ])
          : t('title.Playing.no_track');
      },
      {
        immediate: true,
      }
    );

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
  <div class="absolute w-full h-full select-none !px-0">
    <div class="flex flex-col h-full px-6 pt-8 max-w-xl mx-auto">
      <div class="flex-1 flex flex-col items-center justify-start gap-y-4">
        <template v-if="currentTrackInfo$$q">
          <div class="w-full px-8">
            <router-link
              class="block w-full flex-1 mx-auto"
              style="max-width: min(20rem, calc(100vh - 20rem))"
              :to="`/albums/${currentTrackInfo$$q.track$$q.albumId}`"
            >
              <s-album-image
                class="aspect-square"
                size="400"
                expandable
                :album="currentTrackInfo$$q.track$$q.albumId"
              />
            </router-link>
          </div>
          <div
            class="overflow-hidden flex-grow-1 flex flex-col items-center gap-y-2"
          >
            <router-link
              class="block max-w-max whitespace-nowrap overflow-hidden overflow-ellipsis text-lg"
              :to="`/albums/${currentTrackInfo$$q.track$$q.albumId}`"
            >
              {{ currentTrackInfo$$q.track$$q.title }}
            </router-link>
            <router-link
              class="block max-w-max whitespace-nowrap overflow-hidden overflow-ellipsis text-sm"
              :to="`/artists/${currentTrackInfo$$q.track$$q.artistId}`"
            >
              {{ currentTrackInfo$$q.trackArtist$$q.name }}
            </router-link>
          </div>
        </template>
      </div>
      <!-- we are using position: fixed here due to browser's navigation bar -->
      <div
        class="flex flex-col justify-center gap-y-8 fixed left-0 right-0 bottom-0 w-full max-w-md mx-auto pb-8"
      >
        <s-seek-bar
          class="pt-2"
          :current-time="position$$q"
          :duration="duration$$q"
          @update="seekTo$$q"
        />
        <div
          class="flex flex-row justify-center px-4"
          @click="preventXButton$$q"
          @mousedown="preventXButton$$q"
          @mouseup="preventXButton$$q($event), onMouseUp$$q($event)"
        >
          <!-- clickではなくmouseupでblurButtonを呼んでいるのはキーで操作されたときにblurしないようにするため -->
          <v-btn
            class="bg-transparent"
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
          <div class="flex-1"></div>
          <v-btn
            class="mx-2 bg-transparent"
            flat
            icon
            @click="skipPrevious$$q"
            @mouseup="blurButton$$q"
          >
            <v-icon>mdi-skip-previous</v-icon>
          </v-btn>
          <v-btn class="mx-2" icon @click="play$$q" @mouseup="blurButton$$q">
            <v-icon>
              {{ playing$$q ? 'mdi-pause' : 'mdi-play' }}
            </v-icon>
          </v-btn>
          <v-btn
            flat
            class="mx-2 bg-transparent"
            icon
            @click="skipNext$$q"
            @mouseup="blurButton$$q"
          >
            <v-icon>mdi-skip-next</v-icon>
          </v-btn>
          <div class="flex-1"></div>
          <v-btn
            class="bg-transparent"
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
      </div>
    </div>
  </div>
</template>
