<script lang="ts">
import type { PropType } from 'vue';
import { formatTracksTotalDuration } from '~/logic/duration';
import { calcTrackListHeight } from '~/logic/util';
import { fetchPlaylistForPlayback } from '~/resources/playlist';
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
  },
  setup(props) {
    const { t } = useI18n();

    const playbackStore = usePlaybackStore();

    const loading = ref<boolean>(true);
    const playlist = ref<ResourcePlaylist | null>(null);
    const tracks = ref<readonly ResourceTrack[] | null>(null);

    const playlistId = computed(() =>
      typeof props.playlist === 'string' ? props.playlist : props.playlist.id
    );
    const trackListHeight = computed(() =>
      calcTrackListHeight(tracks.value || [], false)
    );

    watch(
      playlistId,
      (newPlaylistId) => {
        if (!newPlaylistId) {
          return;
        }

        loading.value = true;

        fetchPlaylistForPlayback(newPlaylistId).then((response) => {
          if (response.id !== playlistId.value) {
            return;
          }
          loading.value = false;
          playlist.value = response;
          tracks.value = response.tracks;
        });
      },
      {
        immediate: true,
      }
    );

    const duration = computed(
      () => tracks.value && formatTracksTotalDuration(tracks.value)
    );

    return {
      t,
      playlistId$$q: playlistId,
      imageIds$$q: ref<readonly string[] | undefined>(),
      loading$$q: loading,
      playlist$$q: playlist,
      tracks$$q: tracks,
      duration$$q: duration,
      trackListHeight$$q: trackListHeight,
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
        <div class="p-0 m-0 leading-none">
          <template v-if="linkExcludes.includes(playlistId$$q)">
            <s-image-manager
              attach-to-type="playlist"
              :attach-to-id="playlistId$$q"
              :image-ids="imageIds$$q"
            >
              <template #title>Album Art of {{ playlist$$q?.title }}</template>
              <template #default>
                <s-playlist-image
                  class="w-50 h-50"
                  size="200"
                  :playlist="playlistId$$q"
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
                :playlist="playlistId$$q"
                @image-ids="imageIds$$q = $event"
              />
            </router-link>
          </template>
        </div>
        <div class="flex-1 pl-8 flex flex-col">
          <div class="flex-none playlist-title display-1">
            <div>
              <template v-if="!loading$$q && playlist$$q">
                <template v-if="!linkExcludes?.includes(playlistId$$q)">
                  <router-link :to="`/playlists/${playlistId$$q}`">
                    {{ playlist$$q.title }}
                  </router-link>
                </template>
                <template v-else>
                  <span>{{ playlist$$q.title }}</span>
                </template>
              </template>
            </div>
          </div>
          <div class="flex-1 my-4"></div>
          <div class="flex-none playlist-actions flex flex-row">
            <div>
              <v-btn
                color="primary"
                :disabled="loading$$q"
                @click="play$$q(false)"
              >
                <v-icon left>mdi-play</v-icon>
                <span>{{ t('playlist.Play') }}</span>
              </v-btn>
            </div>
            <div class="mx-4"></div>
            <div>
              <v-btn
                color="accent"
                outlined
                :disabled="loading$$q"
                @click="play$$q(true)"
              >
                <v-icon left>mdi-shuffle</v-icon>
                <span>{{ t('playlist.Shuffle') }}</span>
              </v-btn>
            </div>
          </div>
          <div class="flex-1"></div>
          <div class="flex-none playlist-misc subtitle-2">
            <div v-show="!loading$$q">
              <span>{{
                tracks$$q && t('playlist.n_tracks', tracks$$q.length)
              }}</span>
              <span v-show="duration$$q">, {{ duration$$q }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <s-track-list
      :show-album="false"
      :show-artist="false"
      :show-disc-number="false"
      :tracks="tracks$$q"
      :link-excludes="linkExcludes"
      index-content="index"
      :loading="loading$$q"
      :set-list="tracks$$q"
    />
  </div>
</template>

<style scoped>
.playlist-title {
  font-weight: 600;
}
</style>
