<script lang="ts">
import type { PropType } from 'vue';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { formatTime } from '@/logic/formatTime';
import { usePlaybackStore } from '@/stores/playback';
import { useThemeStore } from '@/stores/theme';
import type { AlbumForPlayback, TrackForPlayback } from '@/types/playback';
import type { ResourceArtist, ResourceImage } from '$/types';

/**
 * インデックスのところに表示する内容
 */
export type IndexContent = 'none' | 'index' | 'trackNumber' | 'albumArtwork';

interface ListItemTrack {
  type$$q: 'track';
  index$$q: number;
  track$$q: TrackForPlayback;
  artist$$q: ResourceArtist;
  album$$q: AlbumForPlayback;
  albumArtist$$q: ResourceArtist;
  formattedDuration$$q: string;
  image$$q: ResourceImage | undefined;
  isLast$$q: boolean;
}

interface ListItemDiscNumberHeader {
  type$$q: 'discNumberHeader';
  discNumber$$q: number;
}

type ListItem = ListItemTrack | ListItemDiscNumberHeader;

export default defineComponent({
  props: {
    tracks: {
      type: Array as PropType<readonly TrackForPlayback[] | null | undefined>,
      default: (): string[] => [],
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
      type: Array as PropType<readonly TrackForPlayback[] | null | undefined>,
      default: undefined,
    },
    showAlbum: Boolean,
    showArtist: Boolean,
    hideDuration: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const playbackStore = usePlaybackStore();
    const themeStore = useThemeStore();

    //

    const useDiscNumber = computed(
      () =>
        (props.showDiscNumber &&
          props.tracks?.some((track) => track.discNumber !== 1)) ||
        false
    );

    const items = computed(() => {
      const tracks = props.tracks;

      if (!tracks) {
        return [];
      }

      let array: ListItemTrack[] | ListItem[] = tracks.map(
        (track, index): ListItemTrack => ({
          type$$q: 'track',
          index$$q: index,
          track$$q: track,
          album$$q: track.album,
          artist$$q: track.artist,
          albumArtist$$q: track.album.artist,
          formattedDuration$$q: formatTime(track.duration),
          image$$q: getDefaultAlbumImage(track.album),
          isLast$$q: index === tracks.length - 1,
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
            });
          }
          array.push(item);
        }
      }

      return array;
    });

    //

    const currentPlayingTrackId = computed(() => {
      return playbackStore.currentTrack$$q.value?.id;
    });

    //

    const selected = ref([]);

    //

    return {
      t,
      showMenu$$q: ref(false),
      imageSize$$q: 36,
      themeStore$$q: themeStore,
      playing$$q: playbackStore.playing$$q,
      s: selected, // v-modelに対してはマングリングできない
      items$$q: items,
      currentPlayingTrackId$$q: currentPlayingTrackId,
      useDiscNumber$$q: useDiscNumber,
      play$$q: (track: TrackForPlayback): void => {
        if (!props.setList) {
          return;
        }
        if (track.id === currentPlayingTrackId.value) {
          playbackStore.playing$$q.value = !playbackStore.playing$$q.value;
          return;
        }
        playbackStore.setSetListAndPlay$$q.value(props.setList, track);
      },
    };
  },
});
</script>

<template>
  <!-- TODO -->
  <!-- v-menu v-model="showMenu$$q">
    <v-list class="bg-surface border rounded">
      <v-list-item link>
        <v-list-item-header>foo</v-list-item-header>
      </v-list-item>
      <v-list-item link>
        <v-list-item-header>bar</v-list-item-header>
      </v-list-item>
      <v-list-item link>
        <v-list-item-header>baz</v-list-item-header>
      </v-list-item>
    </v-list>
  </v-menu -->
  <v-list v-model="s" flat class="select-none">
    <v-list-item class="list-header w-full flex flex-row">
      <div class="list-header-column list-column-icon mr-4 py-2">
        {{
          indexContent === 'index' || indexContent === 'trackNumber' ? '#' : ''
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
    <template v-for="(item, index) in items$$q" :key="index">
      <template v-if="item.type$$q === 'discNumberHeader'">
        <v-sheet tile class="sheet-disc-number-header w-full">
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
        <v-list-item
          class="s-hover-container w-full"
          :ripple="false"
          @contextmenu.prevent="showMenu$$q = true"
        >
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
                  {{ playing$$q ? 'mdi-play-circle' : 'mdi-pause-circle' }}
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
                    {{ index + 1 }}
                  </div>
                </template>
                <template v-if="indexContent === 'trackNumber'">
                  <div class="track-index s-numeric s-hover-hidden">
                    {{ item.track$$q.trackNumber }}
                  </div>
                </template>
                <template v-if="indexContent === 'albumArtwork'">
                  <s-nullable-image
                    class="track-index s-hover-hidden flex-none"
                    icon-size="24px"
                    :image="item.image$$q"
                    :width="imageSize$$q"
                    :height="imageSize$$q"
                    :aspect-ratio="1"
                  />
                </template>
                <v-icon class="play-icon s-hover-visible">
                  mdi-play-circle-outline
                </v-icon>
              </v-btn>
            </div>
          </div>
          <v-list-item-header
            class="list-column-content flex flex-col flex-nowrap justify-center"
          >
            <v-list-item-title
              class="track-title"
            >
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
              v-if="showArtist || item.artist$$q.id !== item.albumArtist$$q.id"
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
          <template v-if="showAlbum">
            <v-list-item-header
              class="list-column-content flex flex-col flex-nowrap justify-center ml-6"
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
                  :disabled="linkExcludes.includes(item.albumArtist$$q.id)"
                >
                  {{ item.albumArtist$$q.name }}
                </s-conditional-link>
              </v-list-item-subtitle>
            </v-list-item-header>
          </template>
          <template v-if="!hideDuration">
            <div class="list-column-duration s-duration body-2">
              {{ item.formattedDuration$$q }}
            </div>
          </template>
        </v-list-item>
        <template v-if="!item.isLast$$q">
          <v-divider />
        </template>
      </template>
    </template>
  </v-list>
</template>

<style scoped>
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
  flex: auto 0 0;
  align-items: baseline;
  max-width: 100%;
}

.track-artist,
.track-album-artist {
  @apply flex;

  flex: auto 0 0;
  line-height: 1 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist::before,
.track-album-artist::before {
  content: '/';
  padding-right: 0.2em;
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
