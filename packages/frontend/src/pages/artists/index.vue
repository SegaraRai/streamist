<script lang="ts">
import { useDisplay } from 'vuetify';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { fetchArtistsForPlayback } from '~/resources/artist';
import { usePlaybackStore } from '~/stores/playback';
import type { ArtistForPlayback } from '~/types/playback';
import type { ResourceImage } from '$/types';

interface ArtistItem {
  id$$q: string;
  artist$$q: ArtistForPlayback;
  image$$q: ResourceImage | undefined;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const playbackStore = usePlaybackStore();

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q.value();
    });

    const artists = ref<ArtistForPlayback[]>([]);

    fetchArtistsForPlayback().then((response) => {
      const responseSetList = response.flatMap((artist) => [
        ...artist.albums.flatMap((album) => album.tracks),
        ...artist.tracks,
      ]);

      artists.value = response;
      playbackStore.setDefaultSetList$$q.value(responseSetList);
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
      imageSize$$q: computed(() => (display.smAndDown.value ? 90 : 180)),
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6">
      <div class="text-h5">
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
              <s-nullable-image
                v-ripple
                class="align-end image white--text rounded-full"
                icon-size="64px"
                :image="item.image$$q"
                :width="imageSize$$q"
                :height="imageSize$$q"
                aspect-ratio="1"
              />
            </router-link>
            <v-card-title class="px-0 pt-1 line-clamp-2">
              <router-link :to="`/artists/${item.artist$$q.id}`">
                <span class="subtitle-1 font-weight-medium">
                  {{ item.artist$$q.name }}
                </span>
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
