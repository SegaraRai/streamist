<script lang="ts">
import type { PropType } from 'vue';
import { compareTrack } from '$shared/sort';
import { db } from '~/db';
import { formatTracksTotalDuration } from '~/logic/duration';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { calcTrackListHeight } from '~/logic/util';
import { usePlaybackStore } from '~/stores/playback';
import type { ResourcePlaylist, ResourceTrack } from '$/types';

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
  setup(props) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();

    const playlistId$$q = eagerComputed(() =>
      typeof props.playlist === 'string' ? props.playlist : props.playlist.id
    );

    const propPlaylistRef = eagerComputed(() => props.playlist);
    const { value } = useLiveQuery(
      async () => {
        const propPlaylist = propPlaylistRef.value;
        const playlist =
          typeof propPlaylist === 'string'
            ? await db.playlists.get(propPlaylist)
            : propPlaylist;
        if (!playlist) {
          throw new Error(`Playlist ${propPlaylist} not found`);
        }
        const tracks = (await db.tracks.bulkGet(
          playlist.trackIds
        )) as readonly ResourceTrack[];
        return {
          playlist,
          tracks,
        };
      },
      [propPlaylistRef],
      true
    );

    const duration = eagerComputed(
      () => value.value?.tracks && formatTracksTotalDuration(value.value.tracks)
    );

    return {
      t,
      playlistId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      duration$$q: duration,
      play$$q: (shuffle?: boolean): void => {
        if (!value.value?.tracks.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(value.value.tracks);
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
            :image-ids="imageIds$$q"
          >
            <template #title>
              Artwork of Playlist {{ value$$q.playlist.title }}
            </template>
            <template #default>
              <s-playlist-image
                class="w-50 h-50"
                size="200"
                :playlist="value$$q.playlist"
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
              :playlist="value$$q.playlist"
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
            {{ value$$q.playlist.title }}
          </s-conditional-link>
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
            {{ t('playlist.n_tracks', value$$q.tracks.length) }}
          </span>
          <span v-show="duration$$q">, {{ duration$$q }}</span>
        </div>
      </div>
    </div>
  </template>
  <s-track-list
    :show-album="false"
    :show-artist="false"
    :show-disc-number="false"
    :tracks="value$$q?.tracks"
    :link-excludes="linkExcludes"
    index-content="index"
    :set-list="value$$q?.tracks"
  />
</template>

<style scoped>
.playlist-title {
  font-weight: 600;
}
</style>
