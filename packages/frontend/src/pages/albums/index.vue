<script lang="ts">
import { useDisplay } from 'vuetify';
import { getDefaultAlbumImage } from '~/logic/albumImage';
import { fetchAlbumsForPlaybackWithTracks } from '~/resources/album';
import { usePlaybackStore } from '~/stores/playback';
import type { AlbumForPlaybackWithTracks } from '~/types/playback';
import type { ResourceArtist, ResourceImage } from '$/types';

interface Item {
  album$$q: AlbumForPlaybackWithTracks;
  artist$$q: ResourceArtist;
  image$$q: ResourceImage | undefined;
  releaseYear$$q: string | undefined;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const playbackStore = usePlaybackStore();

    const albums = ref([] as AlbumForPlaybackWithTracks[]);

    fetchAlbumsForPlaybackWithTracks().then((response) => {
      const responseSetList = response.flatMap((album) => album.tracks);

      albums.value = [
        ...response,
        ...response,
        ...response,
        ...response,
        ...response,
      ];
      playbackStore.setDefaultSetList$$q.value(responseSetList);
    });

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q.value();
    });

    const items = computed(() => {
      return albums.value.map((album): Item => {
        const artist = album.artist;
        const image = getDefaultAlbumImage(album);

        const releaseDate = album.tracks.find(
          (track) => track.releaseDate
        )?.releaseDate;
        const releaseYear =
          (releaseDate && releaseDate.replace(/-.+$/g, '')) || undefined;

        return {
          album$$q: album,
          artist$$q: artist,
          image$$q: image,
          releaseYear$$q: releaseYear,
        };
      });
    });

    return {
      t,
      items$$q: items,
      imageSize$$q: computed(() =>
        display.xs.value ? 90 : display.sm.value ? 120 : 180
      ),
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6">
      <div class="text-h5">
        {{ t('albums.Albums') }}
      </div>
    </header>

    <v-row>
      <v-col
        v-for="item in items$$q"
        :key="item.album$$q.id"
        class="flex"
        cols="auto"
      >
        <v-card flat tile :width="`${imageSize$$q}px`" class="item">
          <router-link class="no-underline" :to="`/albums/${item.album$$q.id}`">
            <s-album-image
              v-ripple
              class="align-end image white--text"
              :style="{
                width: `${imageSize$$q}px`,
                height: `${imageSize$$q}px`,
              }"
              :album-id="item.album$$q.id"
              :size="imageSize$$q"
            />
          </router-link>
          <v-card-title
            class="px-0 pt-1 subtitle-1 font-weight-medium line-clamp-2"
          >
            <router-link :to="`/albums/${item.album$$q.id}`">
              {{ item.album$$q.title }}
            </router-link>
          </v-card-title>
          <v-card-subtitle
            class="px-0 subtitle-2 font-weight-regular flex justify-between"
          >
            <div class="flex-1 artist">
              <router-link :to="`/artists/${item.artist$$q.id}`">
                {{ item.artist$$q.name }}
              </router-link>
            </div>
            <template v-if="item.releaseYear$$q">
              <div class="flex-none pl-2">
                {{ item.releaseYear$$q }}
              </div>
            </template>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.item {
  background: transparent !important;
}

.artist {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
