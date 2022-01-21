<script lang="ts">
import { filterNullAndUndefined } from '$shared/filter';
import { compareTrack } from '$/shared/sort';
import type { ResourceTrack } from '$/types';
import {
  AllItem,
  useAllSearch,
  useFuse,
  useLiveQuery,
  useMenu,
  useNDropdownAlbum,
  useNDropdownPlaylist,
  useNDropdownTrack,
  useRecentlySearched,
  useTrackFilter,
} from '~/composables';
import {
  RECENTLY_SEARCHED_MAX_ENTRIES_DISPLAY,
  SEARCH_DEBOUNCE_INTERVAL,
  SEARCH_DEBOUNCE_MAX_WAIT,
  SEARCH_MAX_ENTRIES_DISPLAY,
} from '~/config';
import { db } from '~/db';
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
    const {
      addRecentlySearchedQuery$$q,
      removeRecentlySearchedQuery$$q,
      queries$$q,
    } = useRecentlySearched();

    const show$$q = useVModel(props, 'modelValue', emit);

    const searchQuery$$q = ref('');

    const debouncedSearchQuery$$q = useDebounce(
      searchQuery$$q,
      SEARCH_DEBOUNCE_INTERVAL,
      {
        maxWait: SEARCH_DEBOUNCE_MAX_WAIT,
      }
    );

    const searchResults$$q = useAllSearch(SEARCH_MAX_ENTRIES_DISPLAY)(
      debouncedSearchQuery$$q
    );

    watch(show$$q, (newShow) => {
      if (!newShow) {
        searchQuery$$q.value = '';
      }
    });

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

    const menuOptionsAlbum = useNDropdownAlbum({
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
    const menuOptionsPlaylist = useNDropdownPlaylist({
      playlist$$q: computed(() =>
        selectedItem.value?.t === 'playlist' ? selectedItem.value.i : undefined
      ),
      playlistTracks$$q: useLiveQuery(async () => {
        if (selectedItem.value?.t !== 'playlist') {
          return [];
        }
        const playlist = selectedItem.value.i;
        const tracks = filterNullAndUndefined(
          await db.tracks.bulkGet(playlist.trackIds as string[])
        );
        return tracks;
      }).value,
      showCreatePlaylist$$q: ref(false),
      closeMenu$$q,
    });
    const menuOptionsTrack = useNDropdownTrack({
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

    const rsFuse = useFuse(queries$$q, { keys: ['query'] });
    const filteredRSQueries$$q = computed(() =>
      (debouncedSearchQuery$$q.value
        ? rsFuse.value
            .search(debouncedSearchQuery$$q.value, {
              limit: RECENTLY_SEARCHED_MAX_ENTRIES_DISPLAY + 1,
            })
            .map(({ item }) => item)
            .filter(({ query }) => query !== debouncedSearchQuery$$q.value)
        : queries$$q.value
      ).slice(0, RECENTLY_SEARCHED_MAX_ENTRIES_DISPLAY)
    );

    return {
      t,
      show$$q,
      searchQuery$$q,
      searchResults$$q,
      debouncedSearchQuery$$q,
      calcHref$$q,
      isTrackAvailable$$q,
      onSelect$$q: (item: AllItem) => {
        addRecentlySearchedQuery$$q(searchQuery$$q.value);
        show$$q.value = false;

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
      filteredRSQueries$$q,
      removeRecentlySearchedQuery$$q,
    };
  },
});
</script>

<template>
  <NModal
    v-model:show="show$$q"
    transform-origin="center"
    class="select-none max-w-xl"
  >
    <VCard class="w-full md:min-w-2xl p-2 h-[75vh] flex flex-col">
      <div>
        <VTextField
          v-model="searchQuery$$q"
          class="s-v-input-hide-details w-full"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          hide-details
        />
        <template v-if="filteredRSQueries$$q.length">
          <VList density="compact">
            <template
              v-for="(item, _index) in filteredRSQueries$$q"
              :key="_index"
            >
              <SSearchHistoryItem
                :query="item.query"
                :at="item.at"
                @click="searchQuery$$q = item.query"
                @remove="removeRecentlySearchedQuery$$q(item.query)"
              />
            </template>
          </VList>
          <template v-if="searchResults$$q.length">
            <VDivider />
          </template>
        </template>
      </div>
      <NScrollbar class="flex-1 s-n-scrollbar-min-h-full" @scroll="onScroll$$q">
        <template v-if="searchResults$$q.length">
          <VList
            :class="selectedItem$$q ? 's-list--selected' : 's-list--unselected'"
          >
            <template
              v-for="({ item }, _index) in searchResults$$q"
              :key="_index"
            >
              <RouterLink
                class="block"
                :to="calcHref$$q(item)"
                @click.prevent="onSelect$$q(item)"
                @contextmenu.prevent="showMenu$$q($event, item)"
              >
                <VListItem
                  class="s-hover-container flex gap-x-4"
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
                  <VListItemAvatar
                    icon
                    class="flex-none flex items-center justify-center"
                  >
                    <div class="w-10 h-10">
                      <template
                        v-if="
                          item.t === 'track' && isTrackAvailable$$q(item.i.id)
                        "
                      >
                        <SAlbumImage
                          class="s-hover-hidden w-full h-full"
                          size="40"
                          :album="item.i.albumId"
                        />
                        <div
                          class="s-hover-visible w-full h-full flex items-center justify-center text-[2rem] light:opacity-80"
                        >
                          <IMdiPlayCircle />
                        </div>
                      </template>
                      <template v-else-if="item.t === 'track'">
                        <SAlbumImage
                          class="w-full h-full"
                          size="40"
                          :album="item.i.albumId"
                        />
                      </template>
                      <template v-else-if="item.t === 'album'">
                        <SAlbumImage
                          class="w-full h-full"
                          size="40"
                          :album="item.i"
                        />
                      </template>
                      <template v-else-if="item.t === 'artist'">
                        <SArtistImage
                          class="w-full h-full"
                          size="40"
                          :artist="item.i"
                        />
                      </template>
                      <template v-else-if="item.t === 'playlist'">
                        <SPlaylistImage
                          class="w-full h-full"
                          size="40"
                          :playlist="item.i"
                        />
                      </template>
                    </div>
                  </VListItemAvatar>
                  <VListItemHeader>
                    <div class="flex-1 flex flex-col">
                      <div class="s-heading-sl text-sm">
                        {{ item.l }}
                      </div>
                      <div class="s-subheading-sl text-xs">
                        {{ t(`dialogComponent.search.type.${item.t}`) }}
                      </div>
                    </div>
                  </VListItemHeader>
                  <VBtn
                    v-show="item.t !== 'artist'"
                    icon
                    flat
                    text
                    size="small"
                    class="bg-transparent"
                    @click.prevent.stop="showMenu$$q($event.target as HTMLElement, item)"
                  >
                    <VIcon class="s-hover-visible">mdi-dots-vertical</VIcon>
                  </VBtn>
                </VListItem>
              </RouterLink>
            </template>
          </VList>
        </template>
        <template v-else-if="debouncedSearchQuery$$q">
          <div class="flex flex-col items-center gap-4 justify-center py-4">
            <div class="text-4xl">
              <IMdiInbox />
            </div>
            <div class="opacity-60">{{ t('search.NoResultsFound') }}</div>
          </div>
        </template>
      </NScrollbar>
    </VCard>
  </NModal>
  <NDropdown
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
