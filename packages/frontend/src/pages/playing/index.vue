<route lang="yaml">
meta:
  layout: app
  hideShell: true
</route>

<script lang="ts">
import type { RepeatType } from '$shared/types';
import { useCurrentTrackInfo } from '~/composables';
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
          <div class="w-full px-4">
            <RouterLink
              class="block w-full flex-1 mx-auto"
              style="max-width: min(20rem, calc(100vh - 20rem))"
              :to="`/albums/${currentTrackInfo$$q.track$$q.albumId}`"
            >
              <SAlbumImage
                class="aspect-square"
                size="400"
                expandable
                :album="currentTrackInfo$$q.track$$q.albumId"
              />
            </RouterLink>
          </div>
          <div
            class="w-full overflow-hidden flex-grow-1 flex flex-col items-center gap-y-2 text-center"
          >
            <RouterLink
              class="s-heading-sl text-lg block max-w-full"
              :to="`/albums/${currentTrackInfo$$q.track$$q.albumId}`"
            >
              {{ currentTrackInfo$$q.track$$q.title }}
            </RouterLink>
            <RouterLink
              class="s-subheading-sl text-sm block max-w-full"
              :to="`/artists/${currentTrackInfo$$q.track$$q.artistId}`"
            >
              {{ currentTrackInfo$$q.trackArtist$$q.name }}
            </RouterLink>
          </div>
        </template>
      </div>
      <!-- we are using position: fixed here due to browser's navigation bar -->
      <div
        class="flex flex-col justify-center gap-y-8 fixed left-0 right-0 bottom-0 w-full max-w-md mx-auto pb-8"
      >
        <SSeekBar
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
          <VBtn
            class="bg-transparent"
            :class="shuffleEnabled$$q ? 'active-button' : ''"
            flat
            icon
            :ripple="false"
            @click="switchShuffle$$q"
            @mouseup="blurButton$$q"
          >
            <VIcon :color="shuffleEnabled$$q ? 'primary' : ''">
              {{ shuffleEnabled$$q ? 'mdi-shuffle' : 'mdi-shuffle-disabled' }}
            </VIcon>
          </VBtn>
          <div class="flex-1"></div>
          <VBtn
            class="mx-2 bg-transparent"
            flat
            icon
            @click="skipPrevious$$q"
            @mouseup="blurButton$$q"
          >
            <VIcon>mdi-skip-previous</VIcon>
          </VBtn>
          <VBtn class="mx-2" icon @click="play$$q" @mouseup="blurButton$$q">
            <VIcon>
              {{ playing$$q ? 'mdi-pause' : 'mdi-play' }}
            </VIcon>
          </VBtn>
          <VBtn
            flat
            class="mx-2 bg-transparent"
            icon
            @click="skipNext$$q"
            @mouseup="blurButton$$q"
          >
            <VIcon>mdi-skip-next</VIcon>
          </VBtn>
          <div class="flex-1"></div>
          <VBtn
            class="bg-transparent"
            :class="repeatEnabled$$q ? 'active-button' : ''"
            flat
            icon
            :ripple="false"
            @click="switchRepeat$$q"
            @mouseup="blurButton$$q"
          >
            <VIcon :color="repeatEnabled$$q ? 'primary' : ''">
              {{ repeatIcon$$q }}
            </VIcon>
          </VBtn>
        </div>
      </div>
    </div>
  </div>
</template>
