<script lang="ts">
import type { MenuOption } from 'naive-ui';
import type { PropType } from 'vue';
import GGrid from 'vue-virtual-scroll-grid';
import { useTheme } from 'vuetify';
import { db } from '~/db';
import { formatTime } from '~/logic/formatTime';
import { getDefaultAlbumImage } from '~/logic/image';
import {
  nCreateDropdownIcon,
  nCreateDropdownTextColorStyle,
} from '~/logic/naive-ui/dropdown';
import { useAllPlaylists } from '~/logic/useDB';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';
import { currentScrollRef } from '~/stores/scroll';
import { useThemeStore } from '~/stores/theme';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';

/**
 * インデックスのところに表示する内容
 */
export type IndexContent = 'none' | 'index' | 'trackNumber' | 'albumArtwork';

interface ListItemTrack {
  type$$q: 'track';
  index$$q: number;
  track$$q: ResourceTrack;
  artist$$q: ResourceArtist;
  album$$q: ResourceAlbum;
  albumArtist$$q: ResourceArtist;
  image$$q: ResourceImage | undefined;
  formattedDuration$$q: string;
  isLast$$q: boolean;
  height$$q: number;
}

interface ListItemDiscNumberHeader {
  type$$q: 'discNumberHeader';
  discNumber$$q: number;
  height$$q: number;
}

type ListItem = ListItemTrack | ListItemDiscNumberHeader;

export default defineComponent({
  components: {
    GGrid,
  },
  props: {
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
  },
  setup(props) {
    const { t } = useI18n();

    const theme = useTheme({});

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

    const allPlaylist = useAllPlaylists();

    //

    const showMenu$$q = ref(false);
    const menuX$$q = ref(0);
    const menuOffsetY$$q = ref(0);
    const menuY$$q = computed(
      () => menuOffsetY$$q.value - currentScrollRef.value
    );
    const selectedTrack$$q = ref<ResourceTrack | undefined>();

    const closeMenu$$q = () => {
      showMenu$$q.value = false;
      selectedTrack$$q.value = undefined;
    };

    const menuOptions$$q = computed<MenuOption[]>((): MenuOption[] => {
      const selectedTrack = selectedTrack$$q.value;
      if (!selectedTrack) {
        return [];
      }

      const currentPlayingTrackId = playbackStore.currentTrack$$q.value?.id;
      const isPlayingThisTrack =
        playbackStore.playing$$q.value &&
        selectedTrack.id === currentPlayingTrackId;

      return [
        {
          key: 'play',
          label: isPlayingThisTrack
            ? t('track-list-dropdown.Pause')
            : t('track-list-dropdown.Play'),
          icon: nCreateDropdownIcon(() =>
            playbackStore.playing$$q.value &&
            selectedTrack.id === playbackStore.currentTrack$$q.value?.id
              ? 'mdi-pause'
              : 'mdi-play'
          ),
          props: {
            onClick: () => {
              if (
                playbackStore.currentTrack$$q.value?.id === selectedTrack.id
              ) {
                playbackStore.playing$$q.value =
                  !playbackStore.playing$$q.value;
              } else if (props.setList) {
                playbackStore.setSetListAndPlay$$q(
                  props.setList,
                  selectedTrack
                );
              }
              closeMenu$$q();
            },
          },
        },
        {
          key: 'addToPNQueue',
          label: t('track-list-dropdown.AddToPlayNextQueue'),
          icon: nCreateDropdownIcon('mdi-playlist-play'),
          props: {
            onClick: () => {
              playbackStore.appendTracksToPlayNextQueue$$q([selectedTrack]);
              closeMenu$$q();
            },
          },
        },
        {
          key: 'edit',
          label: t('track-list-dropdown.Edit'),
          icon: nCreateDropdownIcon('mdi-pencil'),
          props: {
            onClick: () => {
              // open edit track dialog
              closeMenu$$q();
            },
          },
        },
        {
          key: 'addToPlaylist',
          label: t('track-list-dropdown.AddToPlaylist'),
          icon: nCreateDropdownIcon('mdi-playlist-plus'),
          disabled: !allPlaylist.value.value?.length,
          children: allPlaylist.value.value?.map((playlist) => ({
            key: `playlist.${playlist.id}`,
            label: playlist.title,
            disabled: playlist.trackIds.includes(selectedTrack.id),
            props: {
              onClick: () => {
                // add to playlist
                closeMenu$$q();
              },
            },
          })),
        },
        {
          key: 'delete',
          label: t('track-list-dropdown.Delete'),
          icon: nCreateDropdownIcon('mdi-delete'),
          props: {
            style: nCreateDropdownTextColorStyle(theme, 'error'),
            onClick: () => {
              // open edit track dialog
              closeMenu$$q();
            },
          },
        },
      ];
    });

    return {
      t,
      showMenu$$q,
      menuX$$q,
      menuY$$q,
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
      onContextMenu$$q: (event: MouseEvent, track: ResourceTrack): void => {
        event.preventDefault();
        showMenu$$q.value = false;
        nextTick().then(() => {
          selectedTrack$$q.value = track;
          menuX$$q.value = event.clientX;
          menuOffsetY$$q.value = event.clientY + currentScrollRef.value;
          showMenu$$q.value = true;
        });
      },
      closeMenu$$q,
      selectedTrack$$q,
      menuOptions$$q,
      cError: theme.getTheme('dark').colors.error,
      pageSize$$q: eagerComputed(() => Math.max(items.value.length, 1)),
    };
  },
});
</script>

<template>
  <div
    :class="
      selectedTrack$$q ? 's-track-list--selected' : 's-track-list--unselected'
    "
  >
    <v-list
      flat
      density="compact"
      class="s-track-list select-none"
      @contextmenu.prevent
    >
      <v-list-item class="list-header w-full flex flex-row">
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
          <div class="list-header-column list-column-duration py-1">
            <v-icon>mdi-clock-outline</v-icon>
          </div>
        </template>
      </v-list-item>
      <v-divider />
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
            <!-- Disc Number Header -->
            <v-sheet
              tile
              class="sheet-disc-number-header w-full h-6"
              :style="style"
            >
              <v-list-subheader class="list-disc-number-header">
                <div class="list-column-disc-number flex align-center">
                  <v-icon>mdi-disc</v-icon>
                  <span class="disc-number-text s-numeric">
                    {{ item.discNumber$$q }}
                  </span>
                </div>
              </v-list-subheader>
              <v-divider />
            </v-sheet>
          </template>
          <template v-else>
            <!-- Track Item -->
            <div :style="style">
              <v-list-item
                class="s-hover-container s-track-list-item w-full py-1 h-14"
                :class="
                  selectedTrack$$q?.id === item.track$$q.id
                    ? 's-track-list-item--selected'
                    : 's-track-list-item--unselected'
                "
                :ripple="false"
                @contextmenu.prevent="onContextMenu$$q($event, item.track$$q)"
              >
                <!-- Track Number -->
                <div class="list-column-icon mr-4">
                  <!-- hiddenを切り替えるのとv-ifとどっちがいいか -->
                  <div
                    v-show="currentPlayingTrackId$$q === item.track$$q.id"
                    class="icon-container"
                  >
                    <!-- 再生中（または一時停止中）の曲 -->
                    <v-btn
                      icon
                      flat
                      text
                      :disabled="!setList"
                      class="bg-transparent"
                      @click.stop="play$$q(item.track$$q)"
                    >
                      <v-icon class="play-icon s-hover-visible">
                        {{
                          playing$$q
                            ? 'mdi-pause-circle-outline'
                            : 'mdi-play-circle-outline'
                        }}
                      </v-icon>
                      <v-icon class="play-icon s-hover-hidden">
                        {{
                          playing$$q ? 'mdi-play-circle' : 'mdi-pause-circle'
                        }}
                      </v-icon>
                    </v-btn>
                  </div>
                  <div
                    v-show="currentPlayingTrackId$$q !== item.track$$q.id"
                    class="icon-container"
                  >
                    <!-- それ以外の曲 -->
                    <v-btn
                      icon
                      flat
                      text
                      :disabled="!setList"
                      class="bg-transparent"
                      @click.stop="play$$q(item.track$$q)"
                    >
                      <template v-if="indexContent === 'index'">
                        <div class="track-index s-numeric s-hover-hidden">
                          {{ item.index$$q + 1 }}
                        </div>
                      </template>
                      <template v-if="indexContent === 'trackNumber'">
                        <div class="track-index s-numeric s-hover-hidden">
                          {{ item.track$$q.trackNumber }}
                        </div>
                      </template>
                      <template v-if="indexContent === 'albumArtwork'">
                        <s-album-image-x
                          class="track-index s-hover-hidden flex-none w-9 h-9"
                          size="36"
                          :image="item.image$$q"
                        />
                      </template>
                      <v-icon class="play-icon s-hover-visible">
                        mdi-play-circle-outline
                      </v-icon>
                    </v-btn>
                  </div>
                </div>
                <!-- Track Title -->
                <v-list-item-header
                  class="list-column-content flex flex-col flex-nowrap justify-center gap-y-1"
                >
                  <v-list-item-title class="track-title">
                    <span
                      class="block overflow-hidden overflow-ellipsis max-w-max"
                      :class="
                        currentPlayingTrackId$$q === item.track$$q.id
                          ? 'text-primary'
                          : 'cursor-pointer'
                      "
                      @click.stop="
                        currentPlayingTrackId$$q !== item.track$$q.id &&
                          play$$q(item.track$$q)
                      "
                    >
                      {{ item.track$$q.title }}
                    </span>
                  </v-list-item-title>
                  <template
                    v-if="
                      showArtist || item.artist$$q.id !== item.albumArtist$$q.id
                    "
                  >
                    <v-list-item-subtitle class="track-artist">
                      <s-conditional-link
                        class="block overflow-hidden overflow-ellipsis max-w-max"
                        :to="`/artists/${item.artist$$q.id}`"
                        :disabled="linkExcludes.includes(item.artist$$q.id)"
                      >
                        {{ item.artist$$q.name }}
                      </s-conditional-link>
                    </v-list-item-subtitle>
                  </template>
                </v-list-item-header>
                <!-- Album Title -->
                <template v-if="showAlbum">
                  <v-list-item-header
                    class="list-column-content flex flex-col flex-nowrap justify-center ml-6 gap-y-1"
                  >
                    <v-list-item-title class="track-album-title">
                      <s-conditional-link
                        class="block overflow-hidden overflow-ellipsis max-w-max"
                        :to="`/albums/${item.album$$q.id}`"
                        :disabled="linkExcludes.includes(item.album$$q.id)"
                      >
                        {{ item.album$$q.title }}
                      </s-conditional-link>
                    </v-list-item-title>
                    <v-list-item-subtitle class="track-album-artist">
                      <s-conditional-link
                        class="block overflow-hidden overflow-ellipsis max-w-max"
                        :to="`/artists/${item.albumArtist$$q.id}`"
                        :disabled="
                          linkExcludes.includes(item.albumArtist$$q.id)
                        "
                      >
                        {{ item.albumArtist$$q.name }}
                      </s-conditional-link>
                    </v-list-item-subtitle>
                  </v-list-item-header>
                </template>
                <!-- Duration -->
                <template v-if="!hideDuration">
                  <div class="list-column-duration s-duration body-2">
                    {{ item.formattedDuration$$q }}
                  </div>
                </template>
              </v-list-item>
              <!-- Divider -->
              <template v-if="!item.isLast$$q">
                <v-divider />
              </template>
            </div>
          </template>
        </template>
      </g-grid>
    </v-list>
  </div>
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    :x="menuX$$q"
    :y="menuY$$q"
    :options="menuOptions$$q"
    :show="showMenu$$q"
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

.s-track-list--unselected .s-track-list-item:hover,
.s-track-list-item--selected {
  @apply bg-true-gray-400/25;
}

.sheet-header {
  @apply sticky;
  top: 48px;
  z-index: 1;
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
  transition: font-size 0s;
  opacity: 0.8;
}

.play-icon:hover {
  font-size: 36px !important;
  opacity: initial;
}
</style>
