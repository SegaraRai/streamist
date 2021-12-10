<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import NullableImage from '@/components/NullableImage.vue';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { fetchAlbumsForPlaybackWithTracks } from '~/resources/album';
import type { ImageWithFile } from '~/types/image';
import type { AlbumForPlaybackWithTracks } from '~/types/playback';
import type { Artist } from '$prisma/client';

interface Item {
  album$$q: AlbumForPlaybackWithTracks;
  artist$$q: Artist;
  image$$q: ImageWithFile | undefined;
  releaseYear$$q: string | undefined;
}

export default defineComponent({
  components: {
    NullableImage,
  },
  setup() {
    const { t } = useI18n();

    const albums = ref([] as AlbumForPlaybackWithTracks[]);

    fetchAlbumsForPlaybackWithTracks().then((response) => {
      albums.value = response;
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
      imageSize$$q: 180,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-3 px-8">
    <header class="mb-6">
      <div class="display-1 font-weight-medium">{{ t('albums.Albums') }}</div>
    </header>

    <v-row>
      <v-col
        v-for="item in items$$q"
        :key="item.album$$q.id"
        class="d-flex child-flex"
        cols="auto"
      >
        <v-card flat tile :width="`${imageSize$$q}px`" class="item">
          <router-link class="no-underline" :to="`/albums/${item.album$$q.id}`">
            <nullable-image
              v-ripple
              class="align-end image white--text"
              :image="item.image$$q"
              :width="imageSize$$q"
              :height="imageSize$$q"
              aspect-ratio="1"
            />
          </router-link>
          <v-card-title class="px-0 pt-1 subtitle-1 font-weight-medium">
            <router-link :to="`/albums/${item.album$$q.id}`">{{
              item.album$$q.title
            }}</router-link>
          </v-card-title>
          <v-card-subtitle
            class="px-0 subtitle-2 font-weight-regular d-flex justify-between"
          >
            <div class="flex-grow-1 artist">
              <router-link :to="`/artists/${item.artist$$q.id}`">{{
                item.artist$$q.name
              }}</router-link>
            </div>
            <template v-if="item.releaseYear$$q">
              <div class="flex-grow-0 pl-2">{{ item.releaseYear$$q }}</div>
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
