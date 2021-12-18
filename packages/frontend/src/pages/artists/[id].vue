<script lang="ts">
import { useDisplay } from 'vuetify';
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
    const display = useDisplay();
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
      isMobile$$q: computed(() => display.smAndDown.value),
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
  <v-container fluid>
    <template v-if="isMobile$$q">
      <div class="flex flex-col gap-y-4 items-center">
        <s-nullable-image
          class="flex-none align-end rounded-full"
          icon-size="64px"
          :image="loading$$q ? undefined : image$$q"
          :width="200"
          :height="200"
          :aspect-ratio="1"
        />
        <div class="flex-none text-2xl">
          <template v-if="!loading$$q && artist$$q">
            {{ artist$$q.name }}
          </template>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex flex-row gap-x-4">
        <s-nullable-image
          class="flex-none align-end rounded-full"
          icon-size="64px"
          :image="loading$$q ? undefined : image$$q"
          :width="200"
          :height="200"
          :aspect-ratio="1"
        />
        <div class="flex-1">
          <template v-if="!loading$$q && artist$$q">
            {{ artist$$q.name }}
          </template>
        </div>
      </div>
    </template>
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
