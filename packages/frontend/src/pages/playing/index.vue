<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
  hideShell: true
</route>

<script lang="ts">
import { SwipeDirection } from '@vueuse/core';
import type { RepeatType } from '$shared/types';
import { useCurrentTrackInfo, useWS } from '~/composables';
import { SWIPE_DISTANCE_THRESHOLD_BACK } from '~/config';
import { findAncestor } from '~/logic/findAncestor';
import { usePlaybackStore } from '~/stores/playback';
import { useVolumeStore } from '~/stores/volume';

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const volumeStore = useVolumeStore();
    const { value: currentTrackInfo } = useCurrentTrackInfo();
    const { hostSession$$q } = useWS();

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

    const container$$q = ref<HTMLElement | null | undefined>();
    const containerWidth = computed(() => container$$q.value?.offsetWidth);
    const { lengthY } = useSwipe(container$$q, {
      passive: true,
      onSwipeEnd(_e: TouchEvent, direction: SwipeDirection) {
        const yTrigger =
          containerWidth.value &&
          Math.abs(lengthY.value) / containerWidth.value >=
            SWIPE_DISTANCE_THRESHOLD_BACK;

        switch (direction) {
          case SwipeDirection.DOWN:
            if (yTrigger) {
              router.back();
            }
            break;
        }
      },
    });

    return {
      container$$q,
      currentTrackInfo$$q: currentTrackInfo,
      volumeStore$$q: volumeStore,
      showRemainingTime$$q: playbackStore.showRemainingTime$$q,
      playing$$q: playbackStore.playing$$q,
      repeatEnabled$$q: repeatEnabled,
      shuffleEnabled$$q: shuffleEnabled,
      repeatIcon$$q: repeatIcon,
      position$$q: playbackStore.position$$q,
      duration$$q: playbackStore.duration$$q,
      hostSessionName$$q: computed(() =>
        hostSession$$q.value?.you === false
          ? hostSession$$q.value.info.name || hostSession$$q.value.info.platform
          : undefined
      ),
      blurButton$$q: blurButton,
      switchRepeat$$q: switchRepeat,
      switchShuffle$$q: switchShuffle,
      play$$q: (): void => {
        playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
      },
      skipNext$$q: (): void => {
        playbackStore.skipNext$$q();
      },
      goPrevious$$q: (): void => {
        playbackStore.goPrevious$$q();
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
  <div class="absolute w-full h-full select-none !px-0">
    <div class="flex flex-col h-full px-6 pt-8 max-w-xl mx-auto">
      <div
        ref="container$$q"
        class="flex-1 flex flex-col items-center justify-start gap-y-4"
      >
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
        class="flex flex-col justify-center gap-y-4 fixed left-0 right-0 bottom-0 w-full max-w-md mx-auto pb-8"
      >
        <SSeekBar
          v-model="position$$q"
          v-model:show-remaining-time="showRemainingTime$$q"
          class="pt-2"
          :duration="duration$$q"
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
            @click="goPrevious$$q"
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
        <div class="flex gap-4 items-center px-6 h-6">
          <SSessionManager class="flex-none" />
          <div class="flex-1 overflow-hidden">
            <template v-if="hostSessionName$$q">
              <i18n-t
                keypath="session.ListeningOn"
                tag="div"
                class="text-st-primary overflow-hidden overflow-ellipsis"
              >
                <span class="font-bold mx-1">
                  {{ hostSessionName$$q }}
                </span>
              </i18n-t>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
