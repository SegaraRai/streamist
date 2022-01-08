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

    const dropdown$$q = ref<DropdownAlbumInput | undefined>();

    return {
      t,
      items$$q: items,
      imageSize$$q: eagerComputed(() =>
        display.xs.value ? 90 : display.sm.value ? 120 : 180
      ),
      pageSize$$q: eagerComputed(() => Math.max(items.value.length, 1)),
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
    <header class="mb-6">
      <div class="text-h5">
        {{ t('albums.Albums') }}
      </div>
    </header>
    <g-grid
      class="s-g-grid grid gap-y-8"
      :length="items$$q.length"
      :page-provider="async () => items$$q"
      :page-size="pageSize$$q"
    >
      <template #probe>
        <v-card
          flat
          tile
          :width="`${imageSize$$q}px`"
          class="bg-transparent flex flex-col"
        >
          <div
            :style="{
              width: `${imageSize$$q}px`,
              height: `${imageSize$$q}px`,
            }"
          ></div>
          <v-card-title
            class="p-0 my-1 text-base sm:text-lg font-medium !leading-tight flex flex-col items-start"
          >
            <n-ellipsis
              class="w-full flex-1 break-words"
              :line-clamp="2"
              :tooltip="{ showArrow: false }"
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </n-ellipsis>
          </v-card-title>
          <v-card-subtitle class="px-0 text-sm flex justify-between">
            <n-ellipsis class="flex-1" :tooltip="{ showArrow: false }">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </n-ellipsis>
            <div class="flex-none pl-2">9999</div>
          </v-card-subtitle>
        </v-card>
      </template>
      <template
        #default="{
          item,
          style,
        }: {
          item: (typeof items$$q)[0],
          style: string,
        }"
      >
        <v-card
          flat
          tile
          :width="`${imageSize$$q}px`"
          class="bg-transparent flex flex-col"
          :style="style"
          @contextmenu.prevent="showMenu$$q($event, item)"
        >
          <router-link
            v-ripple
            :to="`/albums/${item.album$$q.id}`"
            class="block"
          >
            <s-album-image-x
              :style="{
                width: `${imageSize$$q}px`,
                height: `${imageSize$$q}px`,
              }"
              :image="item.image$$q"
              :size="imageSize$$q"
            />
          </router-link>
          <v-card-title
            class="p-0 my-1 text-base sm:text-lg font-medium !leading-tight flex flex-col items-start"
          >
            <!-- FIXME: leading-tight等でline-heightを縮めると表示しきれていてもoffsetHeightがscrollHeightより小さい値になってツールチップが常に表示されてしまう -->
            <n-ellipsis
              :line-clamp="2"
              :tooltip="{ showArrow: false }"
              class="w-full flex-1 break-words"
            >
              <router-link :to="`/albums/${item.album$$q.id}`">
                {{ item.album$$q.title }}
              </router-link>
            </n-ellipsis>
          </v-card-title>
          <v-card-subtitle class="px-0 text-sm flex justify-between">
            <n-ellipsis class="flex-1" :tooltip="{ showArrow: false }">
              <router-link :to="`/artists/${item.artist$$q.id}`">
                {{ item.artist$$q.name }}
              </router-link>
            </n-ellipsis>
            <template v-if="item.releaseYear$$q">
              <div class="flex-none pl-2">
                {{ item.releaseYear$$q }}
              </div>
            </template>
          </v-card-subtitle>
        </v-card>
      </template>
    </g-grid>
    <s-dropdown-album v-model="dropdown$$q" />
  </v-container>
</template>
