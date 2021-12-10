<script lang="ts">
import axios from 'axios';
import { UnwrapRef, computed, defineComponent, ref, watch } from 'vue';
import TrackList from '@/components/TrackList.vue';
import api from '@/logic/api';
import { formatTracksTotalDuration } from '@/logic/duration';
import { calcTrackListHeight } from '@/logic/util';
import { usePlaybackStore } from '@/stores/playback';
import { TrackForPlayback } from '~/types/playback';
import type { Playlist } from '$prisma/client';

type PlaylistForPlayback = Playlist & {
  tracks: TrackForPlayback[];
};

interface Props {
  playlistId: string;
  linkExcludes: string[];
}

export default defineComponent({
  components: {
    TrackList,
  },
  props: {
    playlistId: {
      type: String,
    },
    linkExcludes: {
      type: Array,
      default: (): string[] => [],
    },
  },
  setup(_props: unknown, context) {
    const { t } = useI18n();

    const props = _props as UnwrapRef<Props>;

    const playbackStore = usePlaybackStore();

    let cancelFormerRequest: (() => void) | null = null;

    const loading = ref<boolean>(true);
    const playlist = ref<PlaylistForPlayback | null>(null);
    const tracks = ref<TrackForPlayback[] | null>(null);

    const playlistId = computed(() => props.playlistId);
    const trackListHeight = computed(() =>
      calcTrackListHeight(tracks.value || [], false)
    );

    watch(
      playlistId,
      (currentPlaylistId, _oldPlaylistId, onInvalidate) => {
        onInvalidate(() => {
          if (cancelFormerRequest) {
            cancelFormerRequest();
            cancelFormerRequest = null;
          }
        });

        loading.value = true;

        api.my.playlists
          ._playlistId(currentPlaylistId)
          .$get({
            query: {
              includeTracks: true,
              includeTrackAlbum: true,
              includeTrackAlbumArtist: true,
              includeTrackAlbumImages: true,
              includeTrackArtist: true,
            },
            config: {
              cancelToken: new axios.CancelToken((func) => {
                cancelFormerRequest = func;
              }),
            },
          })
          .then((response) => {
            cancelFormerRequest = null;

            const responsePlaylist = response as PlaylistForPlayback;

            loading.value = false;
            playlist.value = responsePlaylist;
            tracks.value = responsePlaylist.tracks;

            context.emit('load-playlist', responsePlaylist);
            context.emit('load-tracks', responsePlaylist.tracks);
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
      <div class="d-flex flex-row">
        <div class="flex-grow-1 pl-8 d-flex flex-column">
          <div class="flex-grow-0 playlist-title display-1">
            <v-skeleton-loader
              :loading="loading$$q"
              type="heading@2"
              tile
              height="2.2rem"
            >
              <div>
                <template v-if="!loading$$q && playlist$$q">
                  <template v-if="!linkExcludes.includes(playlistId)">
                    <router-link :to="`/playlists/${playlistId}`">{{
                      playlist$$q.title
                    }}</router-link>
                  </template>
                  <template v-else>
                    <span>{{ playlist$$q.title }}</span>
                  </template>
                </template>
              </div>
            </v-skeleton-loader>
          </div>
          <div class="flex-grow-1 my-4"></div>
          <div class="flex-grow-0 playlist-actions d-flex flex-row">
            <div>
              <v-btn
                color="primary"
                :disabled="loading$$q"
                @click="play$$q(false)"
              >
                <v-icon left>mdi-play</v-icon>
                <span>{{ t('playlist/Play') }}</span>
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
                <span>{{ t('playlist/Shuffle') }}</span>
              </v-btn>
            </div>
          </div>
          <div class="flex-grow-1"></div>
          <div class="flex-grow-0 playlist-misc subtitle-2">
            <v-skeleton-loader
              :loading="loading$$q"
              type="text"
              width="18em"
              tile
            >
              <div v-show="!loading$$q">
                <span>{{
                  tracks$$q && t('playlist/{n} tracks', tracks$$q.length)
                }}</span>
                <span v-show="duration$$q">, {{ duration$$q }}</span>
              </div>
            </v-skeleton-loader>
          </div>
        </div>
      </div>
    </div>
    <track-list
      :show-album="false"
      :show-artist="false"
      :show-disc-number="false"
      :tracks="tracks$$q"
      :link-excludes="linkExcludes"
      index-content="index"
      :loading="loading$$q"
      :set-list="tracks$$q"
    ></track-list>
  </div>
</template>

<style lang="postcss" scoped>
.playlist-title {
  font-weight: 600;
}
</style>
