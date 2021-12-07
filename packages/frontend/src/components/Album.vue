<script lang="ts">
import axios from 'axios';
import { UnwrapRef, computed, defineComponent, ref, watch } from 'vue';
import NullableImage from '@/components/NullableImage.vue';
import TrackList from '@/components/TrackList.vue';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import api from '@/logic/api';
import { formatTracksTotalDuration } from '@/logic/duration';
import { compareTrack } from '@/logic/sort';
import { calcTrackListHeight } from '@/logic/util';
import { usePlaybackStore } from '@/stores/playback';
import type { AlbumForPlayback, TrackForPlayback } from '@/types/playback';

interface Props {
  album?: AlbumForPlayback | null;
  albumId: string;
  linkExcludes: string[];
  loading: boolean;
  /**
   * `null`と`undefined`で意味合いが異なるため注意 \
   * - `null`:      （親コンポーネントで）取得中 \
   * - `undefined`: Album.vueに任せる
   */
  providedTracks?: TrackForPlayback[] | null | undefined;
  setList?: TrackForPlayback[] | null;
}

export default defineComponent({
  components: {
    NullableImage,
    TrackList,
  },
  props: {
    album: Object,
    albumId: {
      type: String,
      required: false,
    },
    linkExcludes: {
      type: Array,
      default: (): string[] => [],
    },
    loading: Boolean,
    providedTracks: {
      type: Array,
      required: false,
    },
    setList: {
      type: Array,
      required: false,
    },
  },
  setup(_props: unknown, context) {
    const props = _props as UnwrapRef<Props>;

    const playbackStore = usePlaybackStore();

    let cancelFormerRequest: (() => void) | null = null;

    const loadedTracksAlbumId = ref<string | undefined>();
    const tracks = ref<TrackForPlayback[] | null>(null);

    const providedTracks = computed(() => props.providedTracks);
    const albumId = computed(() => props.album?.id || props.albumId);
    const loadingTracks = computed(
      () => loadedTracksAlbumId.value !== albumId.value
    );
    const trackListHeight = computed(() =>
      calcTrackListHeight((loadingTracks.value && tracks.value) || [], true)
    );

    watch(
      [albumId, providedTracks] as [typeof albumId, typeof providedTracks],
      (newValues, _oldValues, onInvalidate) => {
        onInvalidate(() => {
          if (cancelFormerRequest) {
            cancelFormerRequest();
            cancelFormerRequest = null;
          }
        });

        const [currentAlbumId, providedTracks] = newValues;

        if (!currentAlbumId) {
          tracks.value = null;
          return;
        }

        if (providedTracks !== undefined) {
          if (providedTracks) {
            tracks.value = [...providedTracks];
            loadedTracksAlbumId.value = currentAlbumId;
            context.emit('load-tracks', tracks.value);
          } else {
            tracks.value = null;
          }
          return;
        }

        api.my.albums
          ._albumId(currentAlbumId)
          .$get({
            query: {
              includeTracks: true,
              includeTrackArtist: true,
              includeAlbumArtist: true,
              includeAlbumImages: true,
            },
            config: {
              cancelToken: new axios.CancelToken((func) => {
                cancelFormerRequest = func;
              }),
            },
          })
          .then((response) => {
            cancelFormerRequest = null;

            // TODO: fetchTrackにはAlbumを含めず、loadingが真になるのを待ってalbumを補完する

            const responseAlbum = response as AlbumForPlayback & {
              tracks: TrackForPlayback[];
            };

            const responseTracks = (
              responseAlbum.tracks as TrackForPlayback[]
            ).sort(compareTrack);

            // for (const track of responseTracks) {
            //   track.album = props.album!;
            // }

            tracks.value = responseTracks;

            loadedTracksAlbumId.value = currentAlbumId;

            context.emit('load-tracks', tracks.value);
          });
      },
      {
        immediate: true,
      }
    );

    const artist = computed(() => props.album?.artist);

    const image = computed(() => {
      return props.album && getDefaultAlbumImage(props.album.images);
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

    return {
      artist$$q: artist,
      image$$q: image,
      tracks$$q: tracks,
      loadingTracks$$q: loadingTracks,
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
      <div class="d-flex flex-row">
        <div class="flex-grow-0">
          <v-skeleton-loader
            :loading="loading"
            type="image"
            :width="imageSize$$q"
            :height="imageSize$$q"
            tile
          >
            <nullable-image
              class="align-end"
              :image="image$$q"
              :width="imageSize$$q"
              :height="imageSize$$q"
              :aspect-ratio="1"
            ></nullable-image>
          </v-skeleton-loader>
        </div>
        <div class="flex-grow-1 pl-8 d-flex flex-column">
          <div class="flex-grow-0 album-title display-1">
            <v-skeleton-loader
              :loading="loading"
              type="heading@2"
              tile
              height="2.2rem"
            >
              <div>
                <template v-if="!loading && album">
                  <template v-if="!linkExcludes.includes(album.id)">
                    <router-link :to="`/albums/${album.id}`">{{
                      album.title
                    }}</router-link>
                  </template>
                  <template v-else>
                    <span>{{ album.title }}</span>
                  </template>
                </template>
              </div>
            </v-skeleton-loader>
          </div>
          <div class="flex-grow-0 album-artist-name title">
            <v-skeleton-loader
              :loading="loading"
              type="heading"
              tile
              :class="loading ? 'pt-2' : ''"
            >
              <div>
                <template v-if="!loading && album">
                  <template
                    v-if="
                      !linkExcludes.includes(
                        artist$$q ? artist$$q.id : album.artist.id
                      )
                    "
                  >
                    <router-link
                      :to="`/artists/${
                        artist$$q ? artist$$q.id : album.artistName.id
                      }`"
                    >
                      {{ album.artistName.name }}
                    </router-link>
                  </template>
                  <template v-else>
                    <span>{{ album.artistName.name }}</span>
                  </template>
                </template>
              </div>
            </v-skeleton-loader>
          </div>
          <template v-if="!loading && !artist$$q && album">
            <div class="flex-grow-0 album-artists subtitle-1">
              <span>(</span>
              <template v-for="(a, index) of album.artist.artists">
                <template v-if="index !== 0">
                  <span :key="a.id + '-d'">,&#32;</span>
                </template>
                <template v-if="!linkExcludes.includes(a.id)">
                  <router-link :key="a.id" :to="`/artists/${a.id}`">{{
                    a.name
                  }}</router-link>
                </template>
                <template v-else>
                  <span :key="a.id">{{ a.name }}</span>
                </template>
              </template>
              <span>)</span>
            </div>
          </template>
          <div class="flex-grow-1"></div>
          <div class="flex-grow-0 album-actions d-flex flex-row">
            <div>
              <v-btn
                color="primary"
                :disabled="loadingTracks$$q"
                @click="play$$q(false)"
              >
                <v-icon left>mdi-play</v-icon>
                <span>{{ $t('album/Play') }}</span>
              </v-btn>
            </div>
            <div class="mx-4"></div>
            <div>
              <v-btn
                color="accent"
                outlined
                :disabled="loadingTracks$$q"
                @click="play$$q(true)"
              >
                <v-icon left>mdi-shuffle</v-icon>
                <span>{{ $t('album/Shuffle') }}</span>
              </v-btn>
            </div>
          </div>
          <div class="flex-grow-1"></div>
          <div class="flex-grow-0 album-misc subtitle-2">
            <v-skeleton-loader
              :loading="loadingTracks$$q"
              type="text"
              width="18em"
              tile
            >
              <div v-show="!loadingTracks$$q">
                <span>{{
                  tracks$$q && $tc('album/{n} tracks', tracks$$q.length)
                }}</span>
                <span v-show="duration$$q">, {{ duration$$q }}</span>
                <span v-show="releaseDate$$q">, {{ releaseDate$$q }}</span>
              </div>
            </v-skeleton-loader>
          </div>
        </div>
      </div>
    </div>
    <v-lazy
      v-model="a"
      :options="{ threshold: 0, rootMargin: '100px' }"
      :min-height="trackListHeight$$q"
    >
      <track-list
        :show-album="false"
        :show-artist="false"
        :tracks="tracks$$q"
        :excludes="['album']"
        :link-excludes="linkExcludes"
        show-disc-number
        index-content="trackNumber"
        :loading="loadingTracks$$q"
        :set-list="setList"
      ></track-list>
    </v-lazy>
  </div>
</template>

<style lang="postcss" scoped>
.album-title {
  font-weight: 600;
}
</style>
