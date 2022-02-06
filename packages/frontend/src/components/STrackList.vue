<script lang="ts">
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import { toUnique } from '$shared/unique';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import {
  useLiveQuery,
  useMenu,
  useNDropdownTrack,
  useTrackFilter,
  useVirtualScrollList,
} from '~/composables';
import { db } from '~/db';
import { formatTime } from '~/logic/formatTime';
import { getDefaultAlbumImage } from '~/logic/image';
import { waitForChange } from '~/logic/waitForChange';
import { usePlaybackStore } from '~/stores/playback';
import {
  currentScrollContainerRef,
  currentScrollContentRef,
  currentScrollRef,
} from '~/stores/scroll';
import {
  ListItemDiscNumberHeader,
  discHeaderHeight,
} from './STrackListDiscHeaderItem.vue';
import { ListItemTrack, trackItemHeight } from './STrackListTrackItem.vue';

type ListItem = ListItemDiscNumberHeader | ListItemTrack;

/**
 * インデックスのところに表示する内容
 */
export type IndexContent = 'none' | 'index' | 'trackNumber' | 'albumArtwork';

export default defineComponent({
  props: {
    renderMode: {
      type: String as PropType<'plain' | 'virtual' | 'draggable'>,
      default: 'virtual',
    },
    tracks: {
      type: Array as PropType<
        readonly string[] | readonly ResourceTrack[] | null | undefined
      >,
      default: undefined,
    },
    showDiscNumber: Boolean,
    indexContent: {
      type: String as PropType<IndexContent>,
      default: 'trackNumber',
    },
    linkExcludes: {
      type: Array as PropType<readonly string[]>,
      default: (): string[] => [],
    },
    loading: Boolean,
    setList: {
      type: Array as PropType<readonly ResourceTrack[] | null | undefined>,
      default: undefined,
    },
    setListName: {
      type: String,
      default: '',
    },
    skipSetListCheck: Boolean,
    hideHeader: Boolean,
    showAlbum: Boolean,
    showArtist: Boolean,
    hideDuration: Boolean,
    removable: Boolean,
    playlistId: {
      type: String as PropType<string | null | undefined>,
      default: undefined,
    },
    visitAlbum: Boolean,
    visitArtist: Boolean,
    showDelete: Boolean,
    disableCurrentPlaying: Boolean,
    scrollTop: {
      type: Number,
      default: undefined,
    },
    scrollContainer: {
      type: Object as PropType<HTMLElement | null | undefined>,
      default: undefined,
    },
    scrollContent: {
      type: Object as PropType<HTMLElement | null | undefined>,
      default: undefined,
    },
    onMove: {
      type: Function as PropType<
        (
          track: ResourceTrack,
          nextTrack: ResourceTrack | undefined
        ) => void | Promise<void>
      >,
      default: undefined,
    },
  },
  emits: {
    play: (_track: ResourceTrack, _index: number) => true,
    remove: (_track: ResourceTrack, _index: number) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const { isTrackAvailable$$q } = useTrackFilter();

    const propTracksRef = eagerComputed(() => props.tracks);
    const { value: trackItems } = useLiveQuery(async () => {
      const propTracks = propTracksRef.value;
      if (!propTracks) {
        return;
      }
      if (propTracks.length === 0) {
        return [];
      }
      const tracks =
        typeof propTracks[0] === 'string'
          ? filterNullAndUndefined(
              await db.tracks.bulkGet(propTracks as string[])
            )
          : (propTracks as readonly ResourceTrack[]);
      const albumMap = new Map<string, ResourceAlbum>(
        filterNullAndUndefined(
          await db.albums.bulkGet(
            toUnique(tracks.map((track) => track.albumId))
          )
        ).map((album) => [album.id, album])
      );
      const artistMap = new Map<string, ResourceArtist>(
        filterNullAndUndefined(
          await db.artists.bulkGet(
            toUnique([
              ...tracks.map((track) => track.artistId),
              ...Array.from(albumMap.values()).map((album) => album.artistId),
            ])
          )
        ).map((artist) => [artist.id, artist])
      );
      const imageMap = new Map<string, ResourceImage>(
        (await db.images.toArray()).map((image) => [image.id, image])
      );
      return filterNullAndUndefined(
        tracks.map((track) => {
          const album = albumMap.get(track.albumId);
          const artist = artistMap.get(track.artistId);
          const albumArtist = album && artistMap.get(album.artistId);
          if (!album || !artist || !albumArtist) {
            return;
          }
          return {
            track,
            album,
            artist,
            albumArtist,
            image: getDefaultAlbumImage(album, imageMap),
          };
        })
      );
    }, [propTracksRef]);

    const useDiscNumber = computed<boolean>(
      () =>
        props.showDiscNumber &&
        !!trackItems.value?.some(
          (trackItem) => trackItem.track.discNumber !== 1
        )
    );

    const propsStrAvailableSetList = computed(
      () =>
        props.setList &&
        props.setList
          .map(({ id }) => id)
          .filter((id) => isTrackAvailable$$q(id))
          .join('\n')
    );

    const playbacksStrAvailableSetList = computed(
      () =>
        playbackStore.currentSetList$$q.value &&
        playbackStore.currentSetList$$q.value
          .map(({ id }) => id)
          .filter((id) => isTrackAvailable$$q(id))
          .join('\n')
    );

    const isSameSetList$$q = eagerComputed(
      () =>
        props.skipSetListCheck ||
        propsStrAvailableSetList.value === playbacksStrAvailableSetList.value
    );

    const items = computed(() => {
      if (!trackItems.value) {
        return [];
      }
      let array: ListItemTrack[] | ListItem[] = trackItems.value.map(
        (track, index, array): ListItemTrack => ({
          type$$q: 'track',
          index$$q: index,
          track$$q: track.track,
          album$$q: track.album,
          artist$$q: track.artist,
          albumArtist$$q: track.albumArtist,
          image$$q: track.image,
          formattedDuration$$q: formatTime(track.track.duration),
          isLast$$q: index === array.length - 1,
          height$$q: trackItemHeight,
        })
      );
      if (useDiscNumber.value) {
        const oldArray = array as ListItemTrack[];
        array = [] as ListItem[];
        let prevDiscNumber: number | undefined;
        for (const item of oldArray) {
          const currentDiscNumber = item.track$$q.discNumber;
          if (currentDiscNumber !== prevDiscNumber) {
            prevDiscNumber = currentDiscNumber;
            array.push({
              type$$q: 'discNumberHeader',
              discNumber$$q: currentDiscNumber,
              height$$q: discHeaderHeight,
            });
          }
          array.push(item);
        }
      }
      return array;
    });
    const trackOnlyItems$$q = computed(() =>
      items.value.filter(
        (item): item is ListItemTrack => item.type$$q === 'track'
      )
    );

    const currentPlayingTrackId = eagerComputed(
      () => playbackStore.currentTrack$$q.value?.id
    );

    const play$$q = (track: ResourceTrack, index: number): void => {
      emit('play', track, index);
      if (!props.setList) {
        return;
      }
      if (track.id === currentPlayingTrackId.value && isSameSetList$$q.value) {
        playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
        return;
      }
      playbackStore.setSetListAndPlay$$q(
        props.setListName,
        props.setList,
        track,
        false
      );
    };

    const dialogEdit$$q = ref(false);
    const dialogDetails$$q = ref(false);
    const lastSelectedTrack$$q = ref<ResourceTrack | undefined>();
    const selectedTrack$$q = ref<ResourceTrack | undefined>();
    const selectedTrackIndex$$q = ref<number | undefined>();
    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
      scrollRef$$q: eagerComputed(
        () => props.scrollTop ?? currentScrollRef.value
      ),
      onClose$$q: () => {
        selectedTrack$$q.value = undefined;
        selectedTrackIndex$$q.value = undefined;
      },
    });
    const menuOptions$$q = useNDropdownTrack({
      selectedTrack$$q,
      isSameSetList$$q,
      playlistId$$q: eagerComputed(() => props.playlistId),
      showVisitAlbum$$q: eagerComputed(() => props.visitAlbum),
      showVisitArtist$$q: eagerComputed(() => props.visitArtist),
      showPlayback$$q: ref(true),
      showDelete$$q: eagerComputed(() => props.showDelete),
      play$$q: (track: ResourceTrack) => {
        if (
          !selectedTrack$$q.value ||
          selectedTrackIndex$$q.value == null ||
          track !== selectedTrack$$q.value
        ) {
          return;
        }
        play$$q(selectedTrack$$q.value, selectedTrackIndex$$q.value);
      },
      openEditTrackDialog$$q: (_track: ResourceTrack) => {
        dialogEdit$$q.value = true;
      },
      openTrackDetailsDialog$$q: (_track: ResourceTrack) => {
        dialogDetails$$q.value = true;
      },
      closeMenu$$q,
    });

    const dragging$$q = ref(false);
    watchEffect(() => {
      if (props.renderMode !== 'draggable') {
        dragging$$q.value = false;
      }
    });

    const { containerStyle, list, listElementRef } = useVirtualScrollList(
      items,
      {
        disabled: eagerComputed(() => props.renderMode !== 'virtual'),
        containerElementRef: eagerComputed(
          () => props.scrollContainer || currentScrollContainerRef.value
        ),
        contentElementRef: eagerComputed(
          () => props.scrollContent || currentScrollContentRef.value
        ),
        itemHeightFunc: (index: number) => items.value[index].height$$q,
      }
    );

    return {
      t,
      playing$$q: playbackStore.playing$$q,
      items$$q: items,
      trackOnlyItems$$q,
      containerStyle$$q: containerStyle,
      virtualListItems$$q: list,
      virtualListElementRef$$q: listElementRef,
      currentPlayingTrackId$$q: currentPlayingTrackId,
      useDiscNumber$$q: useDiscNumber,
      isSameSetList$$q,
      play$$q,
      showMenu$$q: (
        eventOrElement: MouseEvent | HTMLElement,
        item: ListItemTrack
      ): void => {
        openMenu$$q(eventOrElement, () => {
          lastSelectedTrack$$q.value = item.track$$q;
          selectedTrack$$q.value = item.track$$q;
          selectedTrackIndex$$q.value = item.index$$q;
        });
      },
      selectedTrackIndex$$q,
      selectedTrack$$q,
      lastSelectedTrack$$q,
      dialogEdit$$q,
      dialogDetails$$q,
      menuOptions$$q,
      menuIsOpen$$q,
      menuX$$q,
      menuY$$q,
      closeMenu$$q,
      dragging$$q,
      onMove$$q: async (
        item: ListItemTrack,
        nextItem: ListItemTrack | undefined
      ) => {
        await props.onMove?.(item.track$$q, nextItem?.track$$q);
        await waitForChange(trackOnlyItems$$q, 1000);
      },
      remove$$q: (track: ResourceTrack, index: number): void => {
        emit('remove', track, index);
      },
    };
  },
});
</script>

<template>
  <div
    :class="
      dragging$$q || selectedTrack$$q
        ? 's-list--selected'
        : 's-list--unselected'
    "
  >
    <VList
      flat
      density="compact"
      class="s-list select-none"
      @contextmenu.prevent
    >
      <template v-if="!hideHeader">
        <VListItem
          class="w-full py-0 h-8 !min-h-0 flex items-center !<sm:px-2 select-none font-bold text-sm"
        >
          <div class="s-track-list-column-icon mr-4 py-2">
            {{
              indexContent === 'index' || indexContent === 'trackNumber'
                ? '#'
                : ''
            }}
          </div>
          <VListItemHeader
            class="s-track-list-column-title flex items-center py-2"
          >
            <VListItemTitle>
              {{ t('trackList.Title') }}
            </VListItemTitle>
          </VListItemHeader>
          <template v-if="showAlbum">
            <VListItemHeader
              class="s-track-list-column-album flex items-center ml-6 py-2 !<md:hidden"
            >
              <VListItemTitle>
                {{ t('trackList.Album') }}
              </VListItemTitle>
            </VListItemHeader>
          </template>
          <template v-if="!hideDuration">
            <div class="s-track-list-column-duration py-1 !<sm:hidden">
              <VIcon>mdi-clock-outline</VIcon>
            </div>
          </template>
          <div class="s-track-list-column-menu py-1"></div>
          <template v-if="removable">
            <div class="s-track-list-column-menu py-1"></div>
          </template>
        </VListItem>
        <VDivider
          class="mx-1"
          :class="
            renderMode !== 'draggable' &&
            items$$q[0]?.type$$q === 'discNumberHeader'
              ? 'invisible'
              : ''
          "
          @contextmenu.prevent
        />
      </template>
      <template v-if="items$$q.length === 0"></template>
      <template v-if="renderMode === 'plain'">
        <div class="flex flex-col">
          <template v-for="(item, _index) in items$$q" :key="_index">
            <template v-if="item.type$$q === 'discNumberHeader'">
              <STrackListDiscHeaderItem
                :_="(_index || undefined) && undefined"
                :item="item"
              />
            </template>
            <template v-else>
              <STrackListTrackItem
                :item="item"
                :index-content="indexContent"
                :link-excludes="linkExcludes"
                :show-album="showAlbum"
                :show-artist="showArtist"
                :hide-duration="hideDuration"
                :selected="
                  selectedTrackIndex$$q === item.index$$q &&
                  selectedTrack$$q?.id === item.track$$q.id
                "
                :disable-current-playing="
                  disableCurrentPlaying || !isSameSetList$$q
                "
                :removable="removable"
                @play="play$$q(item.track$$q, item.index$$q)"
                @remove="remove$$q(item.track$$q, item.index$$q)"
                @menu="showMenu$$q($event.target as HTMLElement, item)"
                @ctx-menu="showMenu$$q($event, item)"
              />
            </template>
          </template>
        </div>
      </template>
      <template v-else-if="renderMode === 'draggable'">
        <!-- discNumberHeader is not supported with 'draggable' render mode -->
        <SDraggable
          :items="trackOnlyItems$$q"
          item-key="id"
          class="flex flex-col"
          ghost-class="s-list--ghost"
          :on-move="onMove$$q"
          :disabled="trackOnlyItems$$q.length <= 1"
          @dragstart="(dragging$$q = true), closeMenu$$q()"
          @dragend="dragging$$q = false"
        >
          <template #item="{ element }">
            <STrackListTrackItem
              :class="trackOnlyItems$$q.length > 1 && 'active:cursor-move'"
              :item="element"
              :index-content="indexContent"
              :link-excludes="linkExcludes"
              :show-album="showAlbum"
              :show-artist="showArtist"
              :hide-duration="hideDuration"
              :selected="
                selectedTrackIndex$$q === element.index$$q &&
                selectedTrack$$q?.id === element.track$$q.id
              "
              :disable-current-playing="
                disableCurrentPlaying || !isSameSetList$$q
              "
              :removable="removable"
              @play="play$$q(element.track$$q, element.index$$q)"
              @remove="remove$$q(element.track$$q, element.index$$q)"
              @menu="showMenu$$q($event.target as HTMLElement, element)"
              @ctx-menu="showMenu$$q($event, element)"
            />
          </template>
        </SDraggable>
      </template>
      <template v-else-if="renderMode === 'virtual'">
        <div
          ref="virtualListElementRef$$q"
          class="w-full"
          :style="containerStyle$$q"
        >
          <template
            v-for="{ data: item, index: _index } in virtualListItems$$q"
            :key="_index"
          >
            <template v-if="item.type$$q === 'discNumberHeader'">
              <STrackListDiscHeaderItem :item="item" />
            </template>
            <template v-else>
              <STrackListTrackItem
                :item="item"
                :index-content="indexContent"
                :link-excludes="linkExcludes"
                :show-album="showAlbum"
                :show-artist="showArtist"
                :hide-duration="hideDuration"
                :selected="
                  selectedTrackIndex$$q === item.index$$q &&
                  selectedTrack$$q?.id === item.track$$q.id
                "
                :disable-current-playing="
                  disableCurrentPlaying || !isSameSetList$$q
                "
                :removable="removable"
                @play="play$$q(item.track$$q, item.index$$q)"
                @remove="remove$$q(item.track$$q, item.index$$q)"
                @menu="showMenu$$q($event.target as HTMLElement, item)"
                @ctx-menu="showMenu$$q($event, item)"
              />
            </template>
          </template>
        </div>
      </template>
    </VList>
  </div>
  <template v-if="lastSelectedTrack$$q">
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
    <SDialogTrackEdit v-model="dialogEdit$$q" :track="lastSelectedTrack$$q" />
    <SDialogTrackDetails
      v-model="dialogDetails$$q"
      :track="lastSelectedTrack$$q"
    />
  </template>
</template>
