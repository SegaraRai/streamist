<script lang="ts">
import type { PropType } from 'vue';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { db } from '~/db';
import { formatTracksTotalDuration } from '~/logic/duration';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    playlist: {
      type: [String, Object] as PropType<string | ResourcePlaylist>,
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
  emits: {
    trackLoad: (_tracks: readonly ResourceTrack[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    const playlistId$$q = eagerComputed(() =>
      typeof props.playlist === 'string' ? props.playlist : props.playlist.id
    );

    const propPlaylistRef = eagerComputed(() => props.playlist);
    const { value } = useLiveQuery(
      async () => {
        const propPlaylist = propPlaylistRef.value;
        const playlist$$q =
          typeof propPlaylist === 'string'
            ? await db.playlists.get(propPlaylist)
            : propPlaylist;
        if (!playlist$$q) {
          throw new Error(`Playlist ${propPlaylist} not found`);
        }
        const tracks$$q = (await db.tracks.bulkGet(
          playlist$$q.trackIds as string[]
        )) as readonly ResourceTrack[];
        if (propPlaylistRef.value !== propPlaylist) {
          throw new Error('operation aborted');
        }
        emit('trackLoad', tracks$$q);
        return {
          playlist$$q,
          tracks$$q,
        };
      },
      [propPlaylistRef],
      true
    );

    const duration = eagerComputed(
      () => value.value && formatTracksTotalDuration(value.value.tracks$$q)
    );

    return {
      t,
      playlistId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      duration$$q: duration,
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
        <template v-if="linkExcludes.includes(playlistId$$q)">
          <s-image-manager
            attach-to-type="playlist"
            :attach-to-id="playlistId$$q"
            :attach-to-title="value$$q.playlist$$q.title"
            :image-ids="imageIds$$q"
          >
            <template #title>
              Artwork of Playlist {{ value$$q.playlist$$q.title }}
            </template>
            <template #default>
              <s-playlist-image
                class="w-50 h-50"
                size="200"
                :playlist="value$$q.playlist$$q"
                @image-ids="imageIds$$q = $event"
              />
            </template>
          </s-image-manager>
        </template>
        <template v-else>
          <router-link :to="`/playlists/${playlistId$$q}`" class="block">
            <s-playlist-image
              class="w-50 h-50"
              size="200"
              :playlist="value$$q.playlist$$q"
              @image-ids="imageIds$$q = $event"
            />
          </router-link>
        </template>
      </div>
      <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
        <div class="flex-none album-title text-xl">
          <s-conditional-link
            :to="`/playlists/${playlistId$$q}`"
            :disabled="linkExcludes.includes(playlistId$$q)"
          >
            {{ value$$q?.playlist$$q.title }}
          </s-conditional-link>
        </div>
        <div class="flex-1 <md:hidden"></div>
        <div class="flex-none album-actions flex flex-row gap-x-8">
          <v-btn
            color="primary"
            :disabled="!value$$q?.tracks$$q.length"
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
            :disabled="!value$$q?.tracks$$q.length"
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
            {{ t('playlist.n_tracks', value$$q.tracks$$q.length) }}
          </span>
          <span v-show="duration$$q">, {{ duration$$q }}</span>
        </div>
      </div>
    </div>
  </template>
  <s-track-list
    show-album
    show-artist
    :tracks="value$$q?.tracks$$q"
    :link-excludes="linkExcludes"
    index-content="index"
    :set-list="value$$q?.tracks$$q"
    :playlist-id="playlistId$$q"
    visit-album
    visit-artist
  />
</template>

<style scoped>
.playlist-title {
  font-weight: 600;
}
</style>
