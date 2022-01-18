<script lang="ts">
import { useDisplay } from 'vuetify';
import { createMultiMap } from '$shared/multiMap';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import type { DropdownArtistInput } from '~/components/SDropdownArtist.vue';
import {
  useAllAlbums,
  useAllArtists,
  useAllImageMap,
  useAllTracks,
} from '~/composables';
import { getDefaultArtistImage } from '~/logic/image';
import { usePlaybackStore } from '~/stores/playback';

interface Item {
  artist$$q: ResourceArtist;
  image$$q: ResourceImage | undefined;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const playbackStore = usePlaybackStore();

    useHead({
      title: t('title.Artists'),
    });

    const allAlbums = useAllAlbums();
    const allArtists = useAllArtists();
    const allTracks = useAllTracks();
    const allImageMap = useAllImageMap();

    const unmounted = false;
    onBeforeUnmount(() => {
      playbackStore.clearDefaultSetList$$q();
    });

    const items = computed(() => {
      const albums = allAlbums.value.value;
      const artists = allArtists.value.value;
      const tracks = allTracks.value.value;
      const imageMap = allImageMap.value.value;
      if (!albums || !artists || !tracks || !imageMap) {
        return [];
      }

      const albumMultiMapByArtist: ReadonlyMap<string, ResourceAlbum[]> =
        createMultiMap(albums, 'artistId');

      const trackMultiMapByAlbum: ReadonlyMap<string, ResourceTrack[]> =
        createMultiMap(tracks, 'albumId');

      const gridItems = artists.map((artist): Item => {
        const image = getDefaultArtistImage(artist, albums, imageMap);

        return {
          artist$$q: artist,
          image$$q: image,
        };
      });

      if (!unmounted) {
        playbackStore.setDefaultSetList$$q(
          t('setListName.Artists'),
          artists
            .flatMap((artist) => albumMultiMapByArtist.get(artist.id) || [])
            .flatMap((album) => trackMultiMapByAlbum.get(album.id) || [])
        );
      }

      return gridItems;
    });

    const dropdown$$q = ref<DropdownArtistInput | undefined>();

    const displayObj = computed(() => {
      let itemWidth;
      let marginWidth;
      let extraHeight;
      let marginHeight;

      if (display.xs.value) {
        itemWidth = 100;
        marginWidth = 10;
        extraHeight = 60;
        marginHeight = 20;
      } else if (display.sm.value) {
        itemWidth = 140;
        marginWidth = 10;
        extraHeight = 60;
        marginHeight = 20;
      } else if (display.md.value) {
        itemWidth = 160;
        marginWidth = 10;
        extraHeight = 60;
        marginHeight = 20;
      } else {
        itemWidth = 180;
        marginWidth = 20;
        extraHeight = 60;
        marginHeight = 20;
      }

      return {
        width$$q: itemWidth,
        height$$q: itemWidth + extraHeight,
        marginWidth$$q: marginWidth,
        marginHeight$$q: marginHeight,
      };
    });

    return {
      t,
      displayObj$$q: displayObj,
      items$$q: items,
      dropdown$$q,
      showMenu$$q: (target: MouseEvent | HTMLElement, item: Item) => {
        dropdown$$q.value = {
          target$$q: target,
          artist$$q: item.artist$$q,
        };
      },
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-0">
    <header
      class="flex items-baseline gap-x-4 sticky top-0 bg-st-background z-1 pt-3 pb-2 -mx-2 px-2 mb-4"
    >
      <div class="text-h5">
        {{ t('artists.Artists') }}
      </div>
      <template v-if="items$$q.length">
        <div class="light:font-medium opacity-60">
          {{ t('artists.n_items', items$$q.length) }}
        </div>
      </template>
    </header>
    <s-virtual-grid
      :items="items$$q"
      :item-width="displayObj$$q.width$$q"
      :item-height="displayObj$$q.height$$q"
      :item-margin-width="displayObj$$q.marginWidth$$q"
      :item-margin-height="displayObj$$q.marginHeight$$q"
    >
      <template #default="{ data: item, width }">
        <v-card
          flat
          tile
          :width="`${width}px`"
          class="bg-transparent flex flex-col"
          @contextmenu.prevent="showMenu$$q($event, item)"
        >
          <router-link
            v-ripple
            :to="`/artists/${item.artist$$q.id}`"
            class="block rounded-full"
          >
            <s-artist-image-x
              :style="{
                width: `${width}px`,
                height: `${width}px`,
              }"
              :image="item.image$$q"
              :size="width"
              :alt="item.artist$$q.name"
            />
          </router-link>
          <v-card-title
            class="p-0 my-1 text-base sm:text-lg font-bold !leading-tight text-center flex-1 flex flex-col line-clamp-2 break-words"
          >
            <router-link :to="`/artists/${item.artist$$q.id}`">
              {{ item.artist$$q.name }}
            </router-link>
          </v-card-title>
        </v-card>
      </template>
    </s-virtual-grid>
    <s-dropdown-artist v-model="dropdown$$q" />
  </v-container>
</template>
