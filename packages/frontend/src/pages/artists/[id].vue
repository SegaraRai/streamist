<script lang="ts">
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { fetchArtistForPlayback } from '~/resources/artist';
import { usePlaybackStore } from '~/stores/playback';
import type { ArtistForPlayback, TrackForPlayback } from '~/types/playback';
import type { ResourceImage } from '$/types';

export default defineComponent({
  props: {
    id: String,
  },
  setup(props) {
    const playbackStore = usePlaybackStore();

    const id = computed(() => props.id);

    const artist = ref<ArtistForPlayback | undefined>();
    const image = ref<ResourceImage | undefined>();
    const setList = ref<TrackForPlayback[]>([]);
    const albumTracksObject = ref<Record<string, TrackForPlayback[]>>({});
    const isActive = ref({});

    const loading = computed<boolean>(
      (): boolean => artist.value?.id !== id.value
    );

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q.value();
    });

    watch(
      id,
      (newId, _oldValue) => {
        if (!newId) {
          return;
        }

        fetchArtistForPlayback(newId).then((response) => {
          if (response.id !== id.value) {
            return;
          }

          const responseSetList = response.albums.flatMap(
            (album) => album.tracks
          );

          artist.value = response;
          image.value = response.albums
            .map((album) => getDefaultAlbumImage(album))
            .find((x) => x);
          setList.value = responseSetList;
          playbackStore.setDefaultSetList$$q.value(responseSetList);
        });
      },
      {
        immediate: true,
      }
    );

    return {
      id$$q: id,
      artist$$q: artist,
      image$$q: image,
      loading$$q: loading,
      albumTracksObject$$q: albumTracksObject,
      setList$$q: setList,
      a: isActive,
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
          <s-nullable-image
            class="align-end rounded-full"
            icon-size="64px"
            :image="loading$$q ? undefined : image$$q"
            :width="200"
            :height="200"
            :aspect-ratio="1"
          />
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
    <v-divider class="mt-8" />
    <template v-if="!loading$$q && artist$$q">
      <div class="my-12"></div>
      <div class="mb-6">
        <template v-for="album in artist$$q.albums" :key="album.id">
          <div class="my-12">
            <s-album
              :album="album"
              :link-excludes="id$$q ? [id$$q] : []"
              :set-list="setList$$q"
            />
          </div>
        </template>
      </div>
    </template>
  </v-container>
</template>
