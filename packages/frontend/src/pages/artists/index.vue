<script lang="ts">
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { comapreArtist } from '@/logic/sort';
import api from '~/logic/api';
import type { ImageWithFile } from '~/types/image';
import type { Artist } from '$prisma/client';

//

interface ArtistItem {
  id$$q: string;
  artist$$q: Artist | undefined;
  image$$q: ImageWithFile | undefined;
}

export default defineComponent({
  setup() {
    const artists = ref<Artist[]>([]);

    api.my.artists.$get();

    artistNameRepository
      .fetchArtistNames$$q({}, [
        'albums',
        'albums.images',
        'albums.images.imageFiles',
        'artists',
        'artists.images',
        'artists.images.imageFiles',
      ])
      .then((response) => {
        artistNames.value = sortArtistNames(
          response.data as MutableResponseArtistNameDTO[],
          null,
          true
        );
      });

    const artistItems = computed(() => {
      return artists.value.map((artist): ArtistItem => {
        const image = artist.albums
          .map((album) => getDefaultImage(album.images, album.imageOrder))
          .find((x) => x);

        return {
          id$$q: artist.id,
          artist$$q: artist,
          image$$q: image,
        };
      });
    });

    return {
      artistItems$$q: artistItems,
      imageSize$$q: 180,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-3 px-8">
    <header class="mb-6">
      <div class="display-1 font-weight-medium">
        {{ $t('artists/Artists') }}
      </div>
    </header>

    <div class="artists">
      <v-row>
        <v-col
          v-for="item in artistItems$$q"
          :key="item.id$$q"
          class="d-flex child-flex"
          cols="auto"
        >
          <v-card flat tile :width="`${imageSize$$q}px`" class="item">
            <router-link
              class="no-underline"
              :to="`/artists/${item.artist$$q.id}`"
            >
              <nullable-image
                v-ripple
                class="align-end image white--text"
                :image="item.image$$q"
                :width="imageSize$$q"
                :height="imageSize$$q"
                aspect-ratio="1"
              ></nullable-image>
            </router-link>
            <v-card-title class="px-0 pt-1">
              <router-link :to="`/artists/${item.artist$$q.id}`">
                <span class="subtitle-1 font-weight-medium">{{
                  item.artist$$q.name
                }}</span>
                <template v-if="item.differentName$$q">
                  <span class="subtitle-2">
                    ({{ item.artistName$$q.name }})
                  </span>
                </template>
              </router-link>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style lang="postcss" scoped>
.item {
  background: transparent !important;
}
</style>
