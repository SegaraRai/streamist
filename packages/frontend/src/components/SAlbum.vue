<script lang="ts">
import type { PropType } from 'vue';
import { compareTrack } from '$shared/sort';
import type { ResourceAlbum, ResourceTrack } from '$/types';
import { db } from '~/db';
import { formatTracksTotalDuration } from '~/logic/duration';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';

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
    visitAlbum: Boolean,
    visitArtist: Boolean,
  },
  emits: {
    trackLoad: (_tracks: readonly ResourceTrack[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    const albumId$$q = eagerComputed(() =>
      typeof props.album === 'string' ? props.album : props.album.id
    );

    const propAlbumRef = eagerComputed(() => props.album);
    const { value } = useLiveQuery(
      async () => {
        const propAlbum = propAlbumRef.value;
        const album$$q =
          typeof propAlbum === 'string'
            ? await db.albums.get(propAlbum)
            : propAlbum;
        if (!album$$q) {
          throw new Error(`Album ${propAlbum} not found`);
        }
        const artist$$q = await db.artists.get(album$$q.artistId);
        if (!artist$$q) {
          throw new Error(
            `Artist ${album$$q.artistId} not found. (database corrupted)`
          );
        }
        const tracks$$q = await db.tracks
          .where({ albumId: album$$q.id })
          .toArray();
        tracks$$q.sort(compareTrack);
        if (propAlbumRef.value !== propAlbum) {
          throw new Error('operation aborted');
        }
        emit('trackLoad', tracks$$q);
        return {
          album$$q,
          artist$$q,
          tracks$$q,
        };
      },
      [propAlbumRef],
      true
    );

    const releaseDate = eagerComputed(() => {
      return (
        value.value?.tracks$$q
          .map((track) => track.releaseDateText)
          ?.find((x) => x) || null
      );
    });

    const duration = eagerComputed(
      () => value.value && formatTracksTotalDuration(value.value?.tracks$$q)
    );

    return {
      t,
      albumId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      duration$$q: duration,
      releaseDate$$q: releaseDate,
      play$$q: (shuffle?: boolean): void => {
        if (!value.value?.tracks$$q.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(value.value.tracks$$q);
      },
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <div
      class="mb-6 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-6 md:gap-y-4"
    >
      <div class="p-0 m-0 leading-none">
        <template v-if="linkExcludes.includes(albumId$$q)">
          <s-image-manager
            attach-to-type="album"
            :attach-to-id="albumId$$q"
            :attach-to-title="value$$q.album$$q.title"
            :image-ids="imageIds$$q"
          >
            <template #title
              >Album Art of {{ value$$q.album$$q.title }}</template
            >
            <template #default>
              <s-album-image
                class="w-50 h-50"
                size="200"
                :album="value$$q.album$$q"
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
              :album="value$$q.album$$q"
              @image-ids="imageIds$$q = $event"
            />
          </router-link>
        </template>
      </div>
      <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
        <div>
          <div class="flex-none album-title text-xl">
            <s-conditional-link
              :to="`/albums/${albumId$$q}`"
              :disabled="linkExcludes.includes(albumId$$q)"
            >
              {{ value$$q.album$$q.title }}
            </s-conditional-link>
          </div>
          <div class="flex-none album-artist-name">
            <s-conditional-link
              :to="`/artists/${value$$q.artist$$q.id}`"
              :disabled="linkExcludes.includes(value$$q.artist$$q.id)"
            >
              {{ value$$q.artist$$q.name }}
            </s-conditional-link>
          </div>
        </div>
        <div class="flex-1 <md:hidden"></div>
        <div class="flex-none album-actions flex flex-row gap-x-8">
          <v-btn
            color="primary"
            :disabled="!value$$q.tracks$$q.length"
            @click="play$$q(false)"
          >
            <v-icon left>mdi-play</v-icon>
            <span>
              {{ t('album.Play') }}
            </span>
          </v-btn>
          <v-btn
            color="accent"
            outlined
            :disabled="!value$$q.tracks$$q.length"
            @click="play$$q(true)"
          >
            <v-icon left>mdi-shuffle</v-icon>
            <span>
              {{ t('album.Shuffle') }}
            </span>
          </v-btn>
        </div>
        <div class="flex-none album-misc text-sm">
          <span>
            {{ t('album.n_tracks', value$$q.tracks$$q.length) }}
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
    :tracks="value$$q?.tracks$$q"
    :link-excludes="linkExcludes"
    show-disc-number
    index-content="trackNumber"
    :set-list="setList"
    :visit-album="visitAlbum"
    :visit-artist="visitArtist"
  />
</template>

<style scoped>
.album-title {
  font-weight: 600;
}
</style>
