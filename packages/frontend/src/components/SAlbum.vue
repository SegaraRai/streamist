<script lang="ts">
import type { PropType } from 'vue';
import { db } from '~/db';
import { formatTracksTotalDuration } from '~/logic/duration';
import { compareTrack } from '~/logic/sort';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { calcTrackListHeight } from '~/logic/util';
import { usePlaybackStore } from '~/stores/playback';
import { useUploadStore } from '~/stores/upload';
import type { ResourceAlbum, ResourceTrack } from '$/types';

export default defineComponent({
  props: {
    album: {
      type: [String, Object] as PropType<string | ResourceAlbum>,
      required: true,
    },
    linkExcludes: {
      type: Array as PropType<readonly string[]>,
      default: (): string[] => [],
    },
    loading: Boolean,
    setList: {
      type: Array as PropType<readonly ResourceTrack[] | null | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const playbackStore = usePlaybackStore();
    const uploadStore = useUploadStore();

    const albumId$$q = computed(() =>
      typeof props.album === 'string' ? props.album : props.album.id
    );

    const propAlbumRef = computed(() => props.album);
    const { value } = useLiveQuery(
      async () => {
        const propAlbum = propAlbumRef.value;
        const album =
          typeof propAlbum === 'string'
            ? await db.albums.get(propAlbum)
            : propAlbum;
        if (!album) {
          throw new Error(`Album ${propAlbum} not found`);
        }
        const artist = await db.artists.get(album.artistId);
        if (!artist) {
          throw new Error(
            `Artist ${album.artistId} not found. (database corrupted)`
          );
        }
        const tracks = await db.tracks.where({ albumId: album.id }).toArray();
        tracks.sort(compareTrack);
        return {
          album,
          artist,
          tracks,
        };
      },
      [propAlbumRef],
      true
    );

    const album = computed(() => value.value?.album);
    const artist = computed(() => value.value?.artist);
    const tracks = computed(() => value.value?.tracks);

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
      albumId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      inputFileElement$$q: inputFileElement,
      album$$q: album,
      artist$$q: artist,
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
        if (!album.value) {
          return;
        }

        if (album.value.imageIds.length) {
          // TODO: show dialog
        } else {
          inputFileElement.value?.click();
        }
      },
      onFileSelected$$q: (event: Event): void => {
        if (!value.value) {
          return;
        }

        const fileList = (event.target as HTMLInputElement).files;
        if (!fileList) {
          return;
        }

        uploadStore.uploadImageFiles(
          Array.from(fileList),
          'album',
          albumId$$q.value
        );
      },
    };
  },
});
</script>

<template>
  <template v-if="album$$q">
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
        <template v-if="linkExcludes.includes(albumId$$q)">
          <s-image-manager
            attach-to-type="album"
            :attach-to-id="albumId$$q"
            :image-ids="imageIds$$q"
          >
            <template #title>Album Art of {{ album$$q?.title }}</template>
            <template #default>
              <s-album-image
                class="w-50 h-50"
                size="200"
                :album="albumId$$q"
                @image-ids="imageIds$$q = $event"
              />
            </template>
          </s-image-manager>
        </template>
        <template v-else>
          <router-link :to="`/albums/${albumId$$q}`" class="block">
            <s-album-image
              class="w-50 h-50"
              size="200"
              :album="albumId$$q"
              @image-ids="imageIds$$q = $event"
            />
          </router-link>
        </template>
      </div>
      <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
        <div>
          <div class="flex-none album-title text-xl">
            <template v-if="!loading && album$$q">
              <s-conditional-link
                :to="`/albums/${albumId$$q}`"
                :disabled="linkExcludes.includes(albumId$$q)"
              >
                {{ album$$q.title }}
              </s-conditional-link>
            </template>
          </div>
          <div class="flex-none album-artist-name">
            <template v-if="!loading && album$$q && artist$$q">
              <s-conditional-link
                :to="`/artists/${artist$$q.id}`"
                :disabled="linkExcludes.includes(artist$$q.id)"
              >
                {{ artist$$q.name }}
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
  </template>
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
