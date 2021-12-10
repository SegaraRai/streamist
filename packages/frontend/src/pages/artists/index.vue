<script lang="ts">
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { fetchArtistsForPlayback } from '~/resources/artist';
import type { ImageWithFile } from '~/types/image';
import type { ArtistForPlayback } from '~/types/playback';

interface ArtistItem {
  id$$q: string;
  artist$$q: ArtistForPlayback;
  image$$q: ImageWithFile | undefined;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const artists = ref<ArtistForPlayback[]>([]);

    fetchArtistsForPlayback().then((response) => {
      artists.value = response;
    });

    const artistItems = computed(() => {
      return artists.value.map((artist): ArtistItem => {
        const image = artist.albums
          .map((album) => getDefaultAlbumImage(album))
          .find((x) => x);

        return {
          id$$q: artist.id,
          artist$$q: artist,
          image$$q: image,
        };
      });
    });

    return {
      t,
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
        {{ t('artists.Artists') }}
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
              </router-link>
            </v-card-title>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style scoped>
.item {
  background: transparent !important;
}
</style>
