<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

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
  useRenderDelay,
} from '~/composables';
import { RENDER_DELAY_ARTIST_LIST } from '~/config';
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
        return;
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
            .map((track) => track.id)
        );
      }

      return gridItems;
    });

    const dropdown$$q = ref<DropdownArtistInput | undefined>();

    const readyToRender$$q = useRenderDelay(RENDER_DELAY_ARTIST_LIST);

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
      readyToRender$$q,
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
  <VContainer fluid class="pt-0">
    <header class="s-title mb-4">
      <div class="text-h5">
        {{ t('artists.Artists') }}
      </div>
      <template v-if="items$$q?.length">
        <div class="s-subheading-sl">
          {{ t('artists.n_items', items$$q.length) }}
        </div>
      </template>
    </header>
    <template v-if="items$$q">
      <template v-if="items$$q.length">
        <SVirtualGrid
          :items="items$$q"
          :item-width="displayObj$$q.width$$q"
          :item-height="displayObj$$q.height$$q"
          :item-margin-width="displayObj$$q.marginWidth$$q"
          :item-margin-height="displayObj$$q.marginHeight$$q"
          :invisible="!readyToRender$$q"
        >
          <template #default="{ data: item, width }">
            <VCard
              flat
              :rounded="false"
              :width="`${width}px`"
              class="bg-transparent flex flex-col !rounded-none"
              @contextmenu.prevent="showMenu$$q($event, item)"
            >
              <RouterLink
                v-ripple
                :to="`/artists/${item.artist$$q.id}`"
                class="block rounded-full"
              >
                <SArtistImageX
                  :style="{
                    width: `${width}px`,
                    height: `${width}px`,
                  }"
                  :image="item.image$$q"
                  :alt="item.artist$$q.name"
                  :size="width"
                />
              </RouterLink>
              <VCardTitle class="p-0 my-1 flex flex-col">
                <RouterLink
                  class="s-heading block text-base sm:text-lg font-bold line-clamp-2 break-words text-center"
                  :to="`/artists/${item.artist$$q.id}`"
                >
                  {{ item.artist$$q.name }}
                </RouterLink>
              </VCardTitle>
            </VCard>
          </template>
        </SVirtualGrid>
      </template>
      <template v-else>
        <div class="text-base">
          {{ t('artists.no_items') }}
        </div>
      </template>
      <SDropdownArtist v-model="dropdown$$q" />
    </template>
  </VContainer>
</template>
