<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

<script lang="ts">
import { useDisplay } from 'vuetify';
import { filterNullAndUndefined } from '$shared/filter';
import { compareTrack } from '$/shared/sort';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import type { DropdownAlbumInput } from '~/components/SDropdownAlbum.vue';
import {
  useAllAlbums,
  useAllArtists,
  useAllImageMap,
  useAllTracks,
} from '~/composables';
import { usePlaybackStore } from '~/stores/playback';

interface Item {
  readonly album$$q: ResourceAlbum;
  readonly artist$$q: ResourceArtist;
  readonly tracks$$q: readonly ResourceTrack[];
  readonly image$$q: ResourceImage | undefined;
  readonly releaseYear$$q: string | undefined;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const display = useDisplay();
    const playbackStore = usePlaybackStore();

    useHead({
      title: t('title.Albums'),
    });

    const allAlbums = useAllAlbums();
    const allArtists = useAllArtists();
    const allTracks = useAllTracks();
    const allImageMap = useAllImageMap();

    let unmounted = false;
    onBeforeUnmount(() => {
      unmounted = true;
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

      const artistMap = new Map<string, ResourceArtist>(
        artists.map((artist) => [artist.id, artist])
      );

      const gridItems = filterNullAndUndefined(
        albums.map((album): Item | undefined => {
          const artist = artistMap.get(album.artistId);
          if (!artist) {
            return;
          }

          const image =
            album.imageIds.length > 0
              ? imageMap.get(album.imageIds[0])
              : undefined;
          const albumTracks = tracks
            .filter((track) => track.albumId === album.id)
            .sort(compareTrack);

          const releaseDate = albumTracks.find(
            (track) => track.releaseDate
          )?.releaseDate;
          const releaseYear =
            (releaseDate && releaseDate.replace(/-.+$/g, '')) || undefined;

          return {
            album$$q: album,
            artist$$q: artist,
            image$$q: image,
            tracks$$q: albumTracks,
            releaseYear$$q: releaseYear,
          };
        })
      );

      if (!unmounted) {
        playbackStore.setDefaultSetList$$q(
          t('setListName.Albums'),
          gridItems.flatMap((item) => item.tracks$$q.map((track) => track.id))
        );
      }

      return gridItems;
    });

    const displayObj = computed(() => {
      let itemWidth;
      let marginWidth;
      let extraHeight;
      let marginHeight;

      if (display.xs.value) {
        itemWidth = 100;
        marginWidth = 10;
        extraHeight = 80;
        marginHeight = 20;
      } else if (display.sm.value) {
        itemWidth = 140;
        marginWidth = 10;
        extraHeight = 80;
        marginHeight = 20;
      } else if (display.md.value) {
        itemWidth = 160;
        marginWidth = 10;
        extraHeight = 80;
        marginHeight = 20;
      } else {
        itemWidth = 180;
        marginWidth = 20;
        extraHeight = 80;
        marginHeight = 20;
      }

      return {
        width$$q: itemWidth,
        height$$q: itemWidth + extraHeight,
        marginWidth$$q: marginWidth,
        marginHeight$$q: marginHeight,
      };
    });

    const dropdown$$q = ref<DropdownAlbumInput | undefined>();

    return {
      t,
      displayObj$$q: displayObj,
      items$$q: items,
      dropdown$$q,
      showMenu$$q: (target: MouseEvent | HTMLElement, item: Item) => {
        dropdown$$q.value = {
          target$$q: target,
          album$$q: item.album$$q,
          tracks$$q: item.tracks$$q,
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
        {{ t('albums.Albums') }}
      </div>
      <template v-if="items$$q?.length">
        <div class="s-subheading-sl">
          {{ t('albums.n_items', items$$q.length) }}
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
        >
          <template #default="{ data: item, width }">
            <VCard
              flat
              tile
              :width="`${width}px`"
              class="bg-transparent flex flex-col"
              @contextmenu.prevent="showMenu$$q($event, item)"
            >
              <RouterLink
                v-ripple
                :to="`/albums/${item.album$$q.id}`"
                class="block"
              >
                <SAlbumImageX
                  :style="{
                    width: `${width}px`,
                    height: `${width}px`,
                  }"
                  :image="item.image$$q"
                  :size="width"
                  :alt="item.album$$q.title"
                />
              </RouterLink>
              <VCardTitle class="p-0 my-1 flex flex-col items-start">
                <RouterLink
                  class="s-heading block text-base sm:text-lg font-bold line-clamp-2 break-words"
                  :to="`/albums/${item.album$$q.id}`"
                >
                  {{ item.album$$q.title }}
                </RouterLink>
              </VCardTitle>
              <VCardSubtitle
                class="s-subheading-sl px-0 text-sm flex justify-between gap-x-2"
              >
                <RouterLink
                  :to="`/artists/${item.artist$$q.id}`"
                  class="flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap"
                >
                  {{ item.artist$$q.name }}
                </RouterLink>
                <template v-if="item.releaseYear$$q">
                  <div class="flex-none">
                    {{ item.releaseYear$$q }}
                  </div>
                </template>
              </VCardSubtitle>
            </VCard>
          </template>
        </SVirtualGrid>
      </template>
      <template v-else>
        <div class="text-base">
          {{ t('albums.no_items') }}
        </div>
      </template>
      <SDropdownAlbum v-model="dropdown$$q" />
    </template>
  </VContainer>
</template>
