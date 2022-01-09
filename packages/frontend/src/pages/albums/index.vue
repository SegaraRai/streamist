<script lang="ts">
import { useDisplay } from 'vuetify';
import { compareTrack } from '$shared/sort';
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
} from '~/logic/useDB';
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
      playbackStore.setDefaultSetList$$q();
    });

    const items = asyncComputed(async () => {
      const albums = await allAlbums.valueAsync.value;
      const artists = await allArtists.valueAsync.value;
      const tracks = await allTracks.valueAsync.value;
      const imageMap = await allImageMap.valueAsync.value;

      const artistMap = new Map<string, ResourceArtist>(
        artists.map((artist) => [artist.id, artist])
      );

      const gridItems = albums.map((album): Item => {
        const artist = artistMap.get(album.artistId)!;
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
      });

      if (!unmounted) {
        playbackStore.setDefaultSetList$$q(
          gridItems.flatMap((item) => item.tracks$$q)
        );
      }

      return gridItems;
    }, []);

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
  <v-container fluid>
    <header class="mb-6 flex items-baseline gap-x-4">
      <div class="text-h5">
        {{ t('albums.Albums') }}
      </div>
      <template v-if="items$$q.length">
        <div class="opacity-60">
          {{ t('albums.n_albums', items$$q.length) }}
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
            :to="`/albums/${item.album$$q.id}`"
            class="block"
          >
            <s-album-image-x
              :style="{
                width: `${width}px`,
                height: `${width}px`,
              }"
              :image="item.image$$q"
              :size="width"
            />
          </router-link>
          <v-card-title
            class="p-0 my-1 text-base sm:text-lg font-medium !leading-tight flex flex-col items-start line-clamp-2 break-words"
          >
            <router-link :to="`/albums/${item.album$$q.id}`">
              {{ item.album$$q.title }}
            </router-link>
          </v-card-title>
          <v-card-subtitle class="px-0 text-sm flex justify-between">
            <router-link
              :to="`/artists/${item.artist$$q.id}`"
              class="overflow-hidden overflow-ellipsis whitespace-nowrap"
            >
              {{ item.artist$$q.name }}
            </router-link>
            <template v-if="item.releaseYear$$q">
              <div class="flex-none pl-2">
                {{ item.releaseYear$$q }}
              </div>
            </template>
          </v-card-subtitle>
        </v-card>
      </template>
    </s-virtual-grid>
    <s-dropdown-album v-model="dropdown$$q" />
  </v-container>
</template>
