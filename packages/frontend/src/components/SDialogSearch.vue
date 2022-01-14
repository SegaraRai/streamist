<script lang="ts">
import { compareTrack } from '$shared/sort';
import { ResourceTrack } from '$/types';
import { db } from '~/db';
import type { AllItem } from '~/logic/allItem';
import { useTrackFilter } from '~/logic/filterTracks';
import { useMenu } from '~/logic/menu';
import { createAlbumDropdown } from '~/logic/naive-ui/albumDropdown';
import { createPlaylistDropdown } from '~/logic/naive-ui/playlistDropdown';
import { createTrackDropdown } from '~/logic/naive-ui/trackDropdown';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { useAllSearch } from '~/logic/useSearch';
import { usePlaybackStore } from '~/stores/playback';

export default defineComponent({
  props: {
    modelValue: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    const router = useRouter();
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const { isTrackAvailable$$q } = useTrackFilter();

    const show$$q = useVModel(props, 'modelValue', emit);

    const searchQuery$$q = ref('');

    const debouncedSearchQuery$$q = useDebounce(searchQuery$$q, 200, {
      maxWait: 2000,
    });

    const allSearchResults$$q = useAllSearch()(debouncedSearchQuery$$q);
    const searchResults$$q = computed(() =>
      allSearchResults$$q.value.slice(0, 30)
    );

    const calcHref$$q = (item: AllItem) => {
      switch (item.t) {
        case 'album':
          return `/albums/${item.i.id}`;

        case 'artist':
          return `/artists/${item.i.id}`;

        case 'playlist':
          return `/playlists/${item.i.id}`;

        case 'track':
          return `/albums/${item.i.albumId}`;
      }
    };

    useEventListener('keydown', (event) => {
      const element = event.target instanceof HTMLElement ? event.target : null;
      const tagName = element?.tagName;
      const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';

      let toggle = false;
      if (show$$q.value) {
        toggle = event.key === 'Escape';
      } else {
        toggle =
          !isInput &&
          (event.key === '/' || (event.ctrlKey && event.key === 'k'));
      }
      if (toggle) {
        show$$q.value = !show$$q.value;
        event.preventDefault();
      }
    });

    const playTrack = async (track: ResourceTrack): Promise<void> => {
      if (!isTrackAvailable$$q(track.id)) {
        return;
      }

      const tracks$$q = await db.tracks
        .where({ albumId: track.albumId })
        .toArray();

      tracks$$q.sort(compareTrack);

      playbackStore.setSetListAndPlay$$q(track.title, tracks$$q, track, false);
    };

    const selectedItem = ref<AllItem | undefined>();

    const scroll$$q = ref(0);
    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
      scrollRef$$q: scroll$$q,
      onClose$$q: () => {
        selectedItem.value = undefined;
      },
    });

    const menuOptionsAlbum = createAlbumDropdown({
      album$$q: computed(() =>
        selectedItem.value?.t === 'album' ? selectedItem.value.i : undefined
      ),
      albumTracks$$q: useLiveQuery(async () => {
        if (selectedItem.value?.t !== 'album') {
          return [];
        }
        const album = selectedItem.value.i;
        const tracks = await db.tracks.where({ albumId: album.id }).toArray();
        return tracks.sort(compareTrack);
      }).value,
      closeMenu$$q,
    });
    const menuOptionsPlaylist = createPlaylistDropdown({
      playlist$$q: computed(() =>
        selectedItem.value?.t === 'playlist' ? selectedItem.value.i : undefined
      ),
      playlistTracks$$q: useLiveQuery(async () => {
        if (selectedItem.value?.t !== 'playlist') {
          return [];
        }
        const playlist = selectedItem.value.i;
        const tracks = (await db.tracks.bulkGet(
          Array.from(playlist.trackIds)
        )) as ResourceTrack[];
        return tracks;
      }).value,
      showCreatePlaylist$$q: ref(false),
      closeMenu$$q,
    });
    const menuOptionsTrack = createTrackDropdown({
      selectedTrack$$q: computed(() =>
        selectedItem.value?.t === 'track' ? selectedItem.value.i : undefined
      ),
      isSameSetList$$q: ref(true),
      playlistId$$q: ref(),
      showVisitAlbum$$q: ref(true),
      showVisitArtist$$q: ref(true),
      showPlayback$$q: ref(true),
      showDelete$$q: ref(false),
      play$$q: playTrack,
      onNavigate$$q: () => {
        show$$q.value = false;
      },
      closeMenu$$q,
    });

    const menuOptions$$q = computed(() => {
      switch (selectedItem.value?.t) {
        case 'artist':
          // there are currently no items for artists
          return undefined;

        case 'album':
          return menuOptionsAlbum.value;

        case 'playlist':
          return menuOptionsPlaylist.value;

        case 'track':
          return menuOptionsTrack.value;
      }
    });

    return {
      t,
      show$$q,
      searchQuery$$q,
      searchResults$$q,
      debouncedSearchQuery$$q,
      calcHref$$q,
      isTrackAvailable$$q,
      onSelect$$q: (item: AllItem) => {
        show$$q.value = false;
        searchQuery$$q.value = '';

        if (item.t === 'track') {
          playTrack(item.i);
        }

        router.push(calcHref$$q(item));
      },
      onScroll$$q: (e: Event): void => {
        scroll$$q.value = (e.target as HTMLElement).scrollTop;
      },
      selectedItem$$q: selectedItem,
      menuOptions$$q,
      menuIsOpen$$q,
      menuX$$q,
      menuY$$q,
      closeMenu$$q,
      showMenu$$q: (
        eventOrElement: MouseEvent | HTMLElement,
        item: AllItem
      ): void => {
        openMenu$$q(eventOrElement, () => {
          selectedItem.value = item;
        });
      },
    };
  },
});
</script>

<template>
  <n-modal
    v-model:show="show$$q"
    transform-origin="center"
    class="select-none max-w-xl"
  >
    <v-card class="w-full md:min-w-2xl p-2">
      <v-text-field
        v-model="searchQuery$$q"
        class="s-v-input-hide-details w-full mb-4"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
      />
      <n-scrollbar
        class="flex-1 h-[80vh] s-n-scrollbar-min-h-full"
        @scroll="onScroll$$q"
      >
        <template v-if="searchResults$$q.length">
          <v-list
            :class="selectedItem$$q ? 's-list--selected' : 's-list--unselected'"
          >
            <template
              v-for="({ item }, _index) in searchResults$$q"
              :key="_index"
            >
              <router-link
                class="block"
                :to="calcHref$$q(item)"
                @click.prevent="onSelect$$q(item)"
                @contextmenu.prevent="showMenu$$q($event, item)"
              >
                <v-list-item
                  class="flex gap-x-4 s-hover-container"
                  :class="[
                    item.t === 'track' &&
                      !isTrackAvailable$$q(item.i.id) &&
                      'opacity-60',
                    selectedItem$$q?.i.id === item.i.id
                      ? 's-list-item--selected'
                      : 's-list-item--unselected',
                  ]"
                  link
                >
                  <v-list-item-avatar
                    icon
                    class="flex-none flex items-center justify-center"
                  >
                    <div class="w-10 h-10">
                      <template
                        v-if="
                          item.t === 'track' && isTrackAvailable$$q(item.i.id)
                        "
                      >
                        <s-album-image
                          class="w-full h-full s-hover-hidden"
                          size="40"
                          :album="item.i.albumId"
                        />
                        <div
                          class="w-full h-full flex items-center justify-center s-hover-visible text-[2rem]"
                        >
                          <i-mdi-play-circle />
                        </div>
                      </template>
                      <template v-else-if="item.t === 'track'">
                        <s-album-image
                          class="w-full h-full"
                          size="40"
                          :album="item.i.albumId"
                        />
                      </template>
                      <template v-else-if="item.t === 'album'">
                        <s-album-image
                          class="w-full h-full"
                          size="40"
                          :album="item.i"
                        />
                      </template>
                      <template v-else-if="item.t === 'artist'">
                        <s-artist-image
                          class="w-full h-full"
                          size="40"
                          :artist="item.i"
                        />
                      </template>
                      <template v-else-if="item.t === 'playlist'">
                        <s-playlist-image
                          class="w-full h-full"
                          size="40"
                          :playlist="item.i"
                        />
                      </template>
                    </div>
                  </v-list-item-avatar>
                  <v-list-item-header>
                    <div class="flex-1 flex flex-col">
                      <div
                        class="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis"
                      >
                        {{ item.l }}
                      </div>
                      <div class="text-xs opacity-60">
                        {{ t(`dialogComponent.search.type.${item.t}`) }}
                      </div>
                    </div>
                  </v-list-item-header>
                  <v-btn
                    icon
                    flat
                    text
                    size="small"
                    class="bg-transparent"
                    @click.prevent.stop="showMenu$$q($event.target as HTMLElement, item)"
                  >
                    <v-icon class="s-hover-visible"> mdi-dots-vertical </v-icon>
                  </v-btn>
                </v-list-item>
              </router-link>
            </template>
          </v-list>
        </template>
        <template v-else-if="debouncedSearchQuery$$q">
          <div class="flex flex-col items-center gap-4 justify-center py-4">
            <div class="text-4xl">
              <i-mdi-inbox />
            </div>
            <div class="opacity-60">{{ t('search.NoResultsFound') }}</div>
          </div>
        </template>
      </n-scrollbar>
    </v-card>
  </n-modal>
  <n-dropdown
    class="select-none"
    placement="bottom-start"
    trigger="manual"
    :x="menuX$$q"
    :y="menuY$$q"
    :options="menuOptions$$q"
    :show="menuIsOpen$$q"
    :on-clickoutside="closeMenu$$q"
    @contextmenu.prevent
  />
</template>
