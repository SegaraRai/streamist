<script lang="ts">
import GGrid from 'vue-virtual-scroll-grid';
import { useDisplay } from 'vuetify';
import { createMultiMap } from '$shared/multiMap';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import { getDefaultArtistImage } from '~/logic/image';
import {
  useAllAlbums,
  useAllArtists,
  useAllImageMap,
  useAllTracks,
} from '~/logic/useDB';
import { usePlaybackStore } from '~/stores/playback';

interface Item {
  artist$$q: ResourceArtist;
  image$$q: ResourceImage | undefined;
}

export default defineComponent({
  components: {
    GGrid,
  },
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
      playbackStore.setDefaultSetList$$q();
    });

    const items = asyncComputed(async () => {
      const albums = await allAlbums.valueAsync.value;
      const artists = await allArtists.valueAsync.value;
      const tracks = await allTracks.valueAsync.value;
      const imageMap = await allImageMap.valueAsync.value;

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
          artists
            .flatMap((artist) => albumMultiMapByArtist.get(artist.id) || [])
            .flatMap((album) => trackMultiMapByAlbum.get(album.id) || [])
        );
      }

      return gridItems;
    }, []);

    return {
      t,
      items$$q: items,
      imageSize$$q: eagerComputed(() =>
        display.xs.value ? 90 : display.sm.value ? 120 : 180
      ),
      pageSize$$q: eagerComputed(() => Math.max(items.value.length, 1)),
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
    <g-grid
      class="s-g-grid grid gap-8"
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
            class="rounded-full"
            :style="{
              width: `${imageSize$$q}px`,
              height: `${imageSize$$q}px`,
            }"
          ></div>
          <v-card-title
            class="p-0 my-1 subtitle-1 font-weight-medium text-center"
          >
            <!-- FIXME: leading-tight等でline-heightを縮めると表示しきれていてもoffsetHeightがscrollHeightより小さい値になってツールチップが常に表示されてしまう -->
            <n-ellipsis :line-clamp="2" :tooltip="{ showArrow: false }">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </n-ellipsis>
          </v-card-title>
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
        >
          <router-link
            v-ripple
            :to="`/artists/${item.artist$$q.id}`"
            class="block rounded-full"
          >
            <s-artist-image-x
              :style="{
                width: `${imageSize$$q}px`,
                height: `${imageSize$$q}px`,
              }"
              :image="item.image$$q"
              :size="imageSize$$q"
            />
          </router-link>
          <v-card-title
            class="p-0 my-1 subtitle-1 font-weight-medium !leading-tight text-center flex-1 flex flex-col"
          >
            <!-- FIXME: leading-tight等でline-heightを縮めると表示しきれていてもoffsetHeightがscrollHeightより小さい値になってツールチップが常に表示されてしまう -->
            <n-ellipsis :line-clamp="2" :tooltip="{ showArrow: false }">
              <router-link :to="`/artists/${item.artist$$q.id}`">
                {{ item.artist$$q.name }}
              </router-link>
            </n-ellipsis>
          </v-card-title>
        </v-card>
      </template>
    </g-grid>
  </v-container>
</template>
