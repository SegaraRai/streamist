<route lang="yaml">
meta:
  layout: app_playing
</route>

<script lang="ts">
import type { RepeatType } from '$shared/types/playback';
import { db } from '~/db';
import { findAncestor } from '~/logic/findAncestor';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import { useVolumeStore } from '~/stores/volume';

export default defineComponent({
  setup() {
    const playbackStore = usePlaybackStore();
    const volumeStore = useVolumeStore();

    const currentTrack = playbackStore.currentTrack$$q;
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

    const { value: currentTrackInfo } = useLiveQuery(async () => {
      const track = currentTrack.value;
      if (!track) {
        return {};
      }
      const trackArtist$$q = await db.artists.get(track.artistId);
      if (track.id !== currentTrack.value?.id) {
        return {};
      }
      return {
        trackArtist$$q,
      };
    }, [currentTrack]);

    return {
      currentTrackInfo$$q: currentTrackInfo,
      volumeStore$$q: volumeStore,
      currentTrack$$q: currentTrack,
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
  <div
    class="flex-1 flex flex-col p-8 select-none h-full"
    @click="preventXButton$$q"
    @mousedown="preventXButton$$q"
    @mouseup="preventXButton$$q($event), onMouseUp$$q($event)"
  >
    <div class="flex-1 flex flex-col items-center justify-start gap-y-4">
      <template v-if="currentTrack$$q">
        <router-link
          class="block w-full flex-1 px-16"
          :to="`/albums/${currentTrack$$q.albumId}`"
        >
          <s-album-image
            class="w-full h-auto aspect-square"
            size="64"
            :album="currentTrack$$q.albumId"
          />
        </router-link>
        <div
          class="overflow-hidden flex-grow-1 flex flex-col items-center gap-y-2"
        >
          <router-link
            class="block max-w-max whitespace-pre overflow-hidden overflow-ellipsis text-lg"
            :to="`/albums/${currentTrack$$q.albumId}`"
          >
            {{ currentTrack$$q.title }}
          </router-link>
          <router-link
            class="block max-w-max whitespace-pre overflow-hidden overflow-ellipsis text-sm"
            :to="`/artists/${currentTrack$$q.artistId}`"
          >
            {{ currentTrackInfo$$q?.trackArtist$$q?.name }}
          </router-link>
        </div>
      </template>
    </div>
    <div class="flex flex-col justify-center gap-y-4">
      <div class="flex flex-row justify-center px-12">
        <!-- clickではなくmouseupでblurButtonを呼んでいるのはキーで操作されたときにblurしないようにするため -->
        <v-btn
          class="mx-5 bg-transparent"
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
        <v-btn
          class="mx-5 bg-transparent"
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
  </div>
</template>
