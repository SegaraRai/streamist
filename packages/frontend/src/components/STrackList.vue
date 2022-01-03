<script lang="ts">
import type { PropType } from 'vue';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import { db } from '~/db';
import { VueDraggableChangeEvent } from '~/logic/draggable/types';
import { formatTime } from '~/logic/formatTime';
import { getDefaultAlbumImage } from '~/logic/image';
import { useMenu } from '~/logic/menu';
import { createTrackListDropdown } from '~/logic/naive-ui/trackListDropdown';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import { useThemeStore } from '~/stores/theme';
import type { ListItemDiscNumberHeader } from './STrackListDiscHeaderItem.vue';
import type { ListItemTrack } from './STrackListTrackItem.vue';

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
    showAlbum: Boolean,
    showArtist: Boolean,
    hideDuration: Boolean,
    playlistId: {
      type: String as PropType<string | null | undefined>,
      default: undefined,
    },
    visitAlbum: Boolean,
    visitArtist: Boolean,
  },
  emits: {
    move: (_track: ResourceTrack, _nextTrack: ResourceTrack | undefined) =>
      true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const themeStore = useThemeStore();
    //
    const propTracksRef = computed(() => props.tracks);
    const { value: trackItems } = useLiveQuery(async () => {
      const propTracks = propTracksRef.value;
      if (!propTracks) {
        return;
      }
      if (propTracks.length === 0) {
        return [];
      }
      const tracks = (
        typeof propTracks[0] === 'string'
          ? await db.tracks.bulkGet([...(propTracks as readonly string[])])
          : propTracks
      ) as readonly ResourceTrack[];
      const albumMap = new Map<string, ResourceAlbum>(
        (
          await db.albums.bulkGet(
            Array.from(new Set(tracks.map((track) => track.albumId)))
          )
        ).map((album) => [album!.id, album!])
      );
      const artistMap = new Map<string, ResourceArtist>(
        (
          await db.artists.bulkGet(
            Array.from(
              new Set([
                ...tracks.map((track) => track.artistId),
                ...Array.from(albumMap.values()).map((album) => album.artistId),
              ])
            )
          )
        ).map((artist) => [artist!.id, artist!])
      );
      const imageMap = new Map<string, ResourceImage>(
        (await db.images.toArray()).map((image) => [image.id, image])
      );
      return tracks.map((track) => {
        const album = albumMap.get(track.albumId)!;
        return {
          track,
          album,
          artist: artistMap.get(track.artistId)!,
          albumArtist: artistMap.get(album.artistId)!,
          image: getDefaultAlbumImage(album, imageMap),
        };
      });
    }, [propTracksRef]);
    const useDiscNumber = eagerComputed(
      () =>
        (props.showDiscNumber &&
          trackItems.value?.some(
            (trackItem) => trackItem.track.discNumber !== 1
          )) ||
        false
    );
    const items = eagerComputed(() => {
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
          height$$q: 57,
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
              height$$q: 24,
            });
          }
          array.push(item);
        }
      }
      console.log(array);
      return array;
    });
    //
    const currentPlayingTrackId = eagerComputed(
      () => playbackStore.currentTrack$$q.value?.id
    );
    //
    const selectedTrack$$q = ref<ResourceTrack | undefined>();
    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu(() => {
      selectedTrack$$q.value = undefined;
    });
    const menuOptions$$q = createTrackListDropdown({
      closeMenu$$q,
      selectedTrack$$q,
      setList$$q: eagerComputed(() => props.setList),
      playlistId$$q: eagerComputed(() => props.playlistId),
      showVisitAlbum$$q: eagerComputed(() => props.visitAlbum),
      showVisitArtist$$q: eagerComputed(() => props.visitArtist),
      openEditTrackDialog$$q: (_track: ResourceTrack) => {},
    });

    const dragging$$q = ref(false);
    watchEffect(() => {
      if (props.renderMode !== 'draggable') {
        dragging$$q.value = false;
      }
    });

    return {
      t,
      themeStore$$q: themeStore,
      playing$$q: playbackStore.playing$$q,
      items$$q: items,
      currentPlayingTrackId$$q: currentPlayingTrackId,
      useDiscNumber$$q: useDiscNumber,
      play$$q: (track: ResourceTrack): void => {
        if (!props.setList) {
          return;
        }
        if (track.id === currentPlayingTrackId.value) {
          playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
          return;
        }
        playbackStore.setSetListAndPlay$$q(props.setList, track);
      },
      showMenu$$q: (
        eventOrElement: MouseEvent | HTMLElement,
        track: ResourceTrack
      ): void => {
        selectedTrack$$q.value = track;
        openMenu$$q(eventOrElement);
      },
      selectedTrack$$q,
      menuOptions$$q,
      menuIsOpen$$q,
      menuX$$q,
      menuY$$q,
      closeMenu$$q,
      pageSize$$q: eagerComputed(() => Math.max(items.value.length, 1)),
      dragging$$q,
      onTrackOrderChanged$$q: (
        event: VueDraggableChangeEvent<ListItem>
      ): void => {
        const { moved } = event;
        if (!moved) {
          return;
        }

        const { newIndex, oldIndex, element } = moved;
        if (newIndex === oldIndex) {
          return;
        }
        if (element.type$$q === 'discNumberHeader') {
          return;
        }

        const referenceItemIndex = newIndex + (newIndex > oldIndex ? 1 : 0);
        const referenceItem = items.value[referenceItemIndex] as
          | ListItem
          | undefined;
        if (referenceItem?.type$$q === 'discNumberHeader') {
          return;
        }

        emit('move', element.track$$q, referenceItem?.track$$q);
      },
    };
  },
});
</script>

<template>
  <div
    :class="
      dragging$$q || selectedTrack$$q
        ? 's-track-list--selected'
        : 's-track-list--unselected'
    "
  >
    <v-list
      flat
      density="compact"
      class="s-track-list select-none"
      @contextmenu.prevent
    >
      <v-list-item class="list-header w-full flex flex-row !<sm:px-2">
        <div class="list-header-column list-column-icon mr-4 py-2">
          {{
            indexContent === 'index' || indexContent === 'trackNumber'
              ? '#'
              : ''
          }}
        </div>
        <v-list-item-header
          class="list-header-column list-column-content flex flex-row flex-nowrap items-center py-2"
        >
          <v-list-item-title class="track-title">
            {{ t('trackList.Title') }}
          </v-list-item-title>
        </v-list-item-header>
        <template v-if="showAlbum">
          <v-list-item-header
            class="list-header-column list-column-content flex flex-row flex-nowrap items-center ml-6 py-2"
          >
            <v-list-item-title class="track-album-title">
              {{ t('trackList.Album') }}
            </v-list-item-title>
          </v-list-item-header>
        </template>
        <template v-if="!hideDuration">
          <div class="list-header-column list-column-duration py-1 !<sm:hidden">
            <v-icon>mdi-clock-outline</v-icon>
          </div>
        </template>
        <div class="list-header-column list-column-menu py-1"></div>
      </v-list-item>
      <v-divider />
      <template v-if="renderMode === 'plain'">
        <div class="flex flex-col">
          <template v-for="(item, _index) in items$$q" :key="_index">
            <template v-if="item.type$$q === 'discNumberHeader'">
              <s-track-list-disc-header-item :item="item" />
            </template>
            <template v-else>
              <s-track-list-track-item
                :item="item"
                :index-content="indexContent"
                :link-excludes="linkExcludes"
                :set-list="setList"
                :show-album="showAlbum"
                :show-artist="showArtist"
                :hide-duration="hideDuration"
                :selected="selectedTrack$$q?.id === item.track$$q.id"
                @menu="showMenu$$q($event.target as HTMLElement, item.track$$q)"
                @ctx-menu="showMenu$$q($event, item.track$$q)"
              />
            </template>
          </template>
        </div>
      </template>
      <template v-else-if="renderMode === 'draggable'">
        <g-draggable
          :model-value="items$$q"
          item-key="id"
          class="flex flex-col"
          ghost-class="s-track-list--ghost"
          @change="onTrackOrderChanged$$q"
          @start="dragging$$q = true"
          @end="dragging$$q = false"
        >
          <!-- discNumberHeader is not supported with 'draggable' render mode -->
          <template #item="{ element }">
            <template v-if="element.type$$q === 'track'">
              <s-track-list-track-item
                :item="element"
                :index-content="indexContent"
                :link-excludes="linkExcludes"
                :set-list="setList"
                :show-album="showAlbum"
                :show-artist="showArtist"
                :hide-duration="hideDuration"
                :selected="selectedTrack$$q?.id === element.track$$q.id"
                @menu="showMenu$$q($event.target as HTMLElement, element.track$$q)"
                @ctx-menu="showMenu$$q($event, element.track$$q)"
              />
            </template>
          </template>
        </g-draggable>
      </template>
      <template v-else-if="renderMode === 'virtual'">
        <g-grid
          class="grid grid-cols-1"
          :length="items$$q.length"
          :page-provider="async () => items$$q"
          :page-size="pageSize$$q"
        >
          <template #probe>
            <div class="h-57px"></div>
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
            <template v-if="item.type$$q === 'discNumberHeader'">
              <s-track-list-disc-header-item :style="style" :item="item" />
            </template>
            <template v-else>
              <s-track-list-track-item
                :style="style"
                :item="item"
                :index-content="indexContent"
                :link-excludes="linkExcludes"
                :set-list="setList"
                :show-album="showAlbum"
                :show-artist="showArtist"
                :hide-duration="hideDuration"
                :selected="selectedTrack$$q?.id === item.track$$q.id"
                @menu="showMenu$$q($event.target as HTMLElement, item.track$$q)"
                @ctx-menu="showMenu$$q($event, item.track$$q)"
              />
            </template>
          </template>
        </g-grid>
      </template>
    </v-list>
  </div>
  <n-dropdown
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

<style>
.s-track-list--selected .s-track-list-item--unselected .s-hover-visible,
.s-track-list--selected .s-track-list-item--selected .s-hover-hidden {
  display: none;
}

.s-track-list--selected .s-track-list-item--unselected .s-hover-hidden,
.s-track-list--selected .s-track-list-item--selected .s-hover-visible {
  display: flex;
}

.s-track-list--ghost .s-track-list-item,
.s-track-list--unselected .s-track-list-item:hover,
.s-track-list-item--selected {
  @apply bg-true-gray-400/25;
}

.sheet-header {
  @apply sticky;

  top: 48px;
  z-index: 1;
}

.sheet-disc-number-header {
  @apply sticky;

  top: calc(48px + 1px + 34px);
  z-index: 1;
}

.list-disc-number-header {
  height: 28px;
  padding: 0 14px !important;
}

.disc-number-text {
  padding-left: 2px;
  font-weight: 700;
}

.list-column-icon {
  width: 40px;
  text-align: center;
  line-height: 1 !important;
}

.list-column-content {
  flex: 1 1 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

.list-column-duration {
  width: 72px;
  text-align: right;
}

.list-column-menu {
  width: 50px;
  text-align: right;
}

.icon-container {
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
}

.track-title,
.track-album-title {
  @apply leading-tight;

  flex: auto 0 0;
  align-items: baseline;
  max-width: 100%;
}

.track-artist,
.track-album-artist {
  @apply flex;
  @apply leading-tight;

  flex: auto 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-index {
  font-weight: 600;
  letter-spacing: 0.01em !important;
}

.play-icon {
  font-size: 32px !important;
  transition: all 0.1s ease-in-out;
  opacity: 0.9;
}

.play-icon:hover {
  font-size: 36px !important;
  opacity: 1;
}

.list-header {
  @apply pt-0 !important;
  @apply pb-0 !important;
  @apply min-h-0 !important;
  @apply select-none;

  height: 34px;
}

.list-header .track-title,
.list-header .track-album-title {
  @apply text-sm !important;
  @apply font-bold !important;
}
</style>
