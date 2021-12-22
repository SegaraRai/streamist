<script lang="ts">
import type { PropType } from 'vue';
import { getDefaultAlbumImage } from '~/logic/albumImage';
import { formatTracksTotalDuration } from '~/logic/duration';
import { calcTrackListHeight } from '~/logic/util';
import { usePlaybackStore } from '~/stores/playback';
import { useUploadStore } from '~/stores/upload';
import type {
  AlbumForPlaybackWithTracks,
  TrackForPlayback,
} from '~/types/playback';
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
    const uploadStore = useUploadStore();

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

    const inputFileElement = ref<HTMLInputElement | null>(null);

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      inputFileElement$$q: inputFileElement,
      artist$$q: artist,
      image$$q: image,
      tracks$$q: tracks,
      duration$$q: duration,
      releaseDate$$q: releaseDate,
      trackListHeight$$q: trackListHeight,
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
      onAlbumArtClicked$$q: (): void => {
        if (image.value) {
          // TODO: show dialog
        } else {
          inputFileElement.value?.click();
        }
      },
      onFileSelected$$q: (event: Event): void => {
        if (!props.album) {
          return;
        }

        const fileList = (event.target as HTMLInputElement).files;
        if (!fileList) {
          return;
        }

        uploadStore.uploadImageFiles(
          Array.from(fileList),
          'album',
          props.album.id
        );
      },
    };
  },
});
</script>

<template>
  <input
    ref="inputFileElement$$q"
    type="file"
    multiple
    class="hidden"
    filter="image/*"
    @change="onFileSelected$$q"
  />
  <div
    class="mb-6 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-6 md:gap-y-4"
  >
    <div class="p-0 m-0 leading-none">
      <template v-if="linkExcludes.includes(album!.id)">
        <s-image-manager
          attach-to-type="album"
          :attach-to-id="album!.id"
          :image-ids="imageIds$$q"
        >
          <template #title> Album Art of {{ album?.title }} </template>
          <template #default>
            <s-album-image
              class="w-50 h-50"
              size="200"
              :album-id="album!.id"
              @image-ids="imageIds$$q = $event"
            />
          </template>
        </s-image-manager>
      </template>
      <template v-else>
        <router-link :to="`/albums/${album!.id}`" class="block">
          <s-album-image
            class="w-50 h-50"
            size="200"
            :album-id="album!.id"
            @image-ids="imageIds$$q = $event"
          />
        </router-link>
      </template>
    </div>
    <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
      <div>
        <div class="flex-none album-title text-xl">
          <template v-if="!loading && album">
            <s-conditional-link
              :to="`/albums/${album.id}`"
              :disabled="linkExcludes.includes(album.id)"
            >
              {{ album.title }}
            </s-conditional-link>
          </template>
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
      </div>
      <div class="flex-1 <md:hidden"></div>
      <div class="flex-none album-actions flex flex-row gap-x-8">
        <v-btn color="primary" @click="play$$q(false)">
          <v-icon left>mdi-play</v-icon>
          <span>
            {{ t('album.Play') }}
          </span>
        </v-btn>
        <v-btn color="accent" outlined @click="play$$q(true)">
          <v-icon left>mdi-shuffle</v-icon>
          <span>
            {{ t('album.Shuffle') }}
          </span>
        </v-btn>
      </div>
      <div class="flex-none album-misc text-sm">
        <span>
          {{ tracks$$q && t('album.n_tracks', tracks$$q.length) }}
        </span>
        <span v-show="duration$$q">, {{ duration$$q }}</span>
        <span v-show="releaseDate$$q">, {{ releaseDate$$q }}</span>
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
</template>

<style scoped>
.album-title {
  font-weight: 600;
}
</style>
