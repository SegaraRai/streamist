<script lang="ts">
import type { PropType } from 'vue';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { formatTracksTotalDuration } from '@/logic/duration';
import { calcTrackListHeight } from '@/logic/util';
import { usePlaybackStore } from '@/stores/playback';
import type {
  AlbumForPlaybackWithTracks,
  TrackForPlayback,
} from '@/types/playback';
import type { ResourceImage } from '$/types';

export default defineComponent({
  props: {
    album: Object as PropType<AlbumForPlaybackWithTracks>,
    linkExcludes: {
      type: Array as PropType<readonly string[]>,
      default: (): string[] => [],
    },
    loading: Boolean,
    setList: {
      type: Array as PropType<TrackForPlayback[] | null | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const playbackStore = usePlaybackStore();

    const artist = computed(() => props.album?.artist);
    const tracks = computed<TrackForPlayback[] | undefined>(
      () => props.album?.tracks
    );
    const image = computed<ResourceImage | null | undefined>(() => {
      return props.album && getDefaultAlbumImage(props.album);
    });

    const releaseDate = computed(() => {
      return (
        tracks.value?.map((track) => track.releaseDateText)?.find((x) => x) ||
        null
      );
    });

    const duration = computed(
      () => tracks.value && formatTracksTotalDuration(tracks.value)
    );

    const trackListHeight = computed(
      () => tracks.value && calcTrackListHeight(tracks.value, true)
    );

    return {
      t,
      artist$$q: artist,
      image$$q: image,
      tracks$$q: tracks,
      duration$$q: duration,
      releaseDate$$q: releaseDate,
      trackListHeight$$q: trackListHeight,
      imageSize$$q: 200,
      a: false,
      play$$q: (shuffle?: boolean): void => {
        if (!tracks.value || !tracks.value[0]) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q.value(tracks.value);
      },
    };
  },
});
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="flex flex-row">
        <s-nullable-image
          class="flex-none"
          icon-size="64px"
          :image="image$$q"
          :width="imageSize$$q"
          :height="imageSize$$q"
          :aspect-ratio="1"
        />
        <div class="flex-1 pl-8 flex flex-col">
          <div class="flex-none album-title text-xl">
            <div>
              <template v-if="!loading && album">
                <s-conditional-link
                  :to="`/albums/${album.id}`"
                  :disabled="linkExcludes.includes(album.id)"
                >
                  {{ album.title }}
                </s-conditional-link>
              </template>
            </div>
          </div>
          <div class="flex-none album-artist-name">
            <template v-if="!loading && album">
              <s-conditional-link
                :to="`/artists/${album.artist.id}`"
                :disabled="linkExcludes.includes(album.artist.id)"
              >
                {{ album.artist.name }}
              </s-conditional-link>
            </template>
          </div>
          <div class="flex-grow flex-shrink"></div>
          <div class="flex-none album-actions flex flex-row gap-x-8">
            <div>
              <v-btn color="primary" @click="play$$q(false)">
                <v-icon left>mdi-play</v-icon>
                <span>
                  {{ t('album.Play') }}
                </span>
              </v-btn>
            </div>
            <div>
              <v-btn color="accent" outlined @click="play$$q(true)">
                <v-icon left>mdi-shuffle</v-icon>
                <span>
                  {{ t('album.Shuffle') }}
                </span>
              </v-btn>
            </div>
          </div>
          <div class="h-4"></div>
          <div class="flex-none album-misc text-sm">
            <div>
              <span>
                {{ tracks$$q && t('album.n_tracks', tracks$$q.length) }}
              </span>
              <span v-show="duration$$q">, {{ duration$$q }}</span>
              <span v-show="releaseDate$$q">, {{ releaseDate$$q }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <s-track-list
      :show-album="false"
      :show-artist="false"
      :tracks="tracks$$q"
      :link-excludes="linkExcludes"
      show-disc-number
      index-content="trackNumber"
      :set-list="setList"
    />
  </div>
</template>

<style scoped>
.album-title {
  font-weight: 600;
}
</style>
