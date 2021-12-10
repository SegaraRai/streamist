<script lang="ts">
import { getDefaultAlbumImage } from '@/logic/albumImage';
import apiInstance from '~/logic/api';
import type { AlbumWithImageFile, ImageWithFile } from '~/types/image';
import type { AlbumForPlayback, TrackForPlayback } from '~/types/playback';
import type { Artist, Track } from '$prisma/client';

type ResponseArtist = Artist & {
  albums: AlbumWithImageFile[];
  tracks: Track & { album: AlbumWithImageFile };
};

interface AlbumWithTracksForPlayback extends AlbumForPlayback {
  tracks: TrackForPlayback[];
}

export default defineComponent({
  props: {
    id: String,
  },
  setup(props) {
    const id = computed(() => props.id);

    let cancelFormerRequestForArtist: (() => void) | null = null;

    const artist = ref<ResponseArtist | undefined>();
    const image = ref<ImageWithFile | undefined>();
    const setListAlbumIds = ref<string[] | undefined>();
    const loadedAlbums = ref<AlbumWithTracksForPlayback[]>([]);
    const albumTracksObject = ref<Record<string, TrackForPlayback[]>>({});
    const isActive = ref({});

    const loading = computed<boolean>(
      (): boolean => artist.value?.id !== id.value
    );
    const setList = computed<TrackForPlayback[] | undefined>(
      (): TrackForPlayback[] | undefined => {
        if (loading.value) {
          return;
        }
        if (!setListAlbumIds.value) {
          return;
        }
        if (loadedAlbums.value.length < setListAlbumIds.value.length) {
          return;
        }
        const tracks: TrackForPlayback[] = [];
        for (const albumId of setListAlbumIds.value) {
          const album = loadedAlbums.value.find(
            (album) => album.id === albumId
          );
          if (!album) {
            return;
          }
          tracks.push(...album.tracks);
        }
        return tracks;
      }
    );

    watch(
      id,
      (newId, _oldValue, onInvalidate) => {
        onInvalidate(() => {
          if (cancelFormerRequestForArtist) {
            cancelFormerRequestForArtist();
            cancelFormerRequestForArtist = null;
          }
        });

        if (!newId) {
          return;
        }

        apiInstance.my.artists
          ._artistId(newId)
          .$get({
            query: {
              includeAlbums: true,
              includeAlbumImages: true,
              includeTracks: true,
              includeTrackAlbum: true,
              includeTrackAlbumImages: true,
            },
          })
          .then((response) => {
            cancelFormerRequestForArtist = null;

            const rArtist = response as ResponseArtist;

            const rAlbums = rArtist.albums;

            artist.value = rArtist;
            image.value = rAlbums
              .map((album) => getDefaultAlbumImage(album))
              .find((x) => x);

            loadedAlbums.value = [];
            setListAlbumIds.value = rAlbums.map((album) => album.id);
          });
      },
      {
        immediate: true,
      }
    );

    // todo: update set list

    return {
      id$$q: id,
      artist$$q: artist,
      image$$q: image,
      loading$$q: loading,
      albumTracksObject$$q: albumTracksObject,
      setList$$q: setList,
      a: isActive,
      loadTracks$$q: (
        album: AlbumWithImageFile,
        artist: Artist,
        tracks: TrackForPlayback[]
      ): void => {
        loadedAlbums.value.push({
          ...album,
          artist,
          tracks,
        });
      },
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-3 px-8">
    <div class="d-flex flex-row">
      <div class="flex-grow-0">
        <v-skeleton-loader
          :loading="loading$$q"
          type="image"
          :width="200"
          :height="200"
          tile
        >
          <nullable-image
            class="align-end"
            :image="loading$$q ? undefined : image$$q"
            :width="200"
            :height="200"
            :aspect-ratio="1"
          ></nullable-image>
        </v-skeleton-loader>
      </div>
      <div class="flex-grow-1 pl-8 d-flex flex-column">
        <div class="flex-grow-0 artist-title display-1">
          <v-skeleton-loader :loading="loading$$q" type="heading@2" tile>
            <div>
              <template v-if="!loading$$q && artist$$q">
                {{ artist$$q.name }}
              </template>
            </div>
          </v-skeleton-loader>
        </div>
      </div>
    </div>
    <v-divider class="mt-8"></v-divider>
    <template v-if="!loading$$q && artist$$q">
      <div class="my-12"></div>
      <div class="mb-6">
        <template v-for="album in artist$$q.albums" :key="album.id">
          <div class="my-12">
            <album
              :loading="false"
              :album="album"
              :link-excludes="[id$$q]"
              :set-list="setList$$q"
              :provided-tracks="albumTracksObject$$q[album.id] || null"
              @load-tracks="loadTracks$$q(album, artist$$q!, $event)"
            />
          </div>
        </template>
      </div>
    </template>
  </v-container>
</template>
