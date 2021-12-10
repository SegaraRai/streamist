<script lang="ts">
import type { PropType } from 'vue';
import { getDefaultAlbumImage } from '@/logic/albumImage';
import { formatTime } from '@/logic/formatTime';
import { usePlaybackStore } from '@/stores/playback';
import { useThemeStore } from '@/stores/theme';
import type { ImageWithFile } from '@/types/image';
import type { AlbumForPlayback, TrackForPlayback } from '@/types/playback';
import type { Artist } from '$prisma/client';

/**
 * インデックスのところに表示する内容
 */
export type IndexContent = 'none' | 'index' | 'trackNumber' | 'albumArtwork';

interface ListItemTrack {
  type$$q: 'track';
  index$$q: number;
  track$$q: TrackForPlayback;
  artist$$q: Artist;
  album$$q: AlbumForPlayback;
  albumArtist$$q: Artist;
  formattedDuration$$q: string;
  image$$q: ImageWithFile | undefined;
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
      type: String,
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

    const selected = reactive([] as number[]);

    //

    return {
      t,
      imageSize$$q: 32,
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
  <v-list flat :class="themeStore$$q.bgClass">
    <v-list-item-group v-model="s" multiple>
      <v-sheet
        tile
        class="sheet-header"
        :class="themeStore$$q.bgClass"
      >
        <v-subheader class="list-header">
          <div class="list-header-column list-column-icon subtitle-2 mr-4 py-2">
            {{
              indexContent === 'index' || indexContent === 'trackNumber'
                ? '#'
                : ''
            }}
          </div>
          <v-list-item-content
            class="list-header-column list-column-content d-flex flex-row flex-nowrap mr-6 py-2"
          >
            <v-list-item-title class="track-title subtitle-2">{{
              t('tracklist/Title')
            }}</v-list-item-title>
          </v-list-item-content>
          <template v-if="showAlbum">
            <v-list-item-content
              class="list-header-column list-column-content d-flex flex-row flex-nowrap mr-6 py-2"
            >
              <v-list-item-title class="track-album-title subtitle-2">{{
                t('tracklist/Album')
              }}</v-list-item-title>
            </v-list-item-content>
          </template>
          <div class="list-header-column list-column-duration py-1">
            <v-icon>mdi-clock-outline</v-icon>
          </div>
        </v-subheader>
        <v-divider />
      </v-sheet>
      <template v-for="(item, index) in items$$q" :key="index">
        <template v-if="item.type$$q === 'discNumberHeader'">
          <v-sheet
            tile
            class="sheet-discnumber-header"
            :class="themeStore$$q.bgClass"
          >
            <v-subheader class="list-discnumber-header">
              <div class="list-column-discnumber d-flex align-center">
                <v-icon>mdi-disc</v-icon>
                <span class="discnumber-text numeric">{{
                  item.discNumber$$q
                }}</span>
              </div>
            </v-subheader>
            <v-divider />
          </v-sheet>
        </template>
        <template v-else>
          <v-list-item class="hover-container" :ripple="false">
            <div class="list-column-icon mr-4">
              <!-- hiddenを切り替えるのとv-ifとどっちがいいか -->
              <div
                v-show="currentPlayingTrackId$$q === item.track$$q.id"
                class="icon-container"
              >
                <!-- 再生中（または一時停止中）の曲 -->
                <v-btn
                  icon
                  text
                  :disabled="!setList"
                  @click.stop="play$$q(item.track$$q)"
                >
                  <v-icon class="play-icon hover-display">{{
                    playing$$q
                      ? 'mdi-pause-circle-outline'
                      : 'mdi-play-circle-outline'
                  }}</v-icon>
                  <v-icon class="play-icon hover-hidden">{{
                    playing$$q ? 'mdi-play-circle' : 'mdi-pause-circle'
                  }}</v-icon>
                </v-btn>
              </div>
              <div
                v-show="currentPlayingTrackId$$q !== item.track$$q.id"
                class="icon-container"
              >
                <!-- それ以外の曲 -->
                <v-btn
                  icon
                  text
                  :disabled="!setList"
                  @click.stop="play$$q(item.track$$q)"
                >
                  <template v-if="indexContent === 'index'">
                    <div class="track-index numeric hover-hidden">
                      {{ index + 1 }}
                    </div>
                  </template>
                  <template v-if="indexContent === 'trackNumber'">
                    <div class="track-index numeric hover-hidden">
                      {{ item.track$$q.trackNumber }}
                    </div>
                  </template>
                  <template v-if="indexContent === 'albumArtwork'">
                    <nullable-image
                      class="track-index hover-hidden"
                      :image="item.image$$q"
                      :width="imageSize$$q"
                      :height="imageSize$$q"
                      :aspect-ratio="1"
                    />
                  </template>
                  <v-icon class="play-icon hover-display">
                    mdi-play-circle-outline
                  </v-icon>
                </v-btn>
              </div>
            </div>
            <v-list-item-content
              class="list-column-content d-flex flex-row flex-nowrap mr-6"
            >
              <v-list-item-title class="track-title">{{
                item.track$$q.title
              }}</v-list-item-title>
              <template
                v-if="
                  showArtist || item.artist$$q.id !== item.albumArtist$$q.id
                "
              >
                <v-list-item-subtitle class="track-artist pl-4">
                  <conditional-link
                    :to="`/artists/${item.artist$$q.id}`"
                    :disabled="linkExcludes.includes(item.artist$$q.id)"
                  >
                    {{ item.artist$$q.name }}
                  </conditional-link>
                </v-list-item-subtitle>
              </template>
            </v-list-item-content>
            <template v-if="showAlbum">
              <v-list-item-content
                class="list-column-content d-flex flex-row flex-nowrap mr-6"
              >
                <v-list-item-title class="track-album-title">
                  <conditional-link
                    :to="`/albums/${item.album$$q.id}`"
                    :disabled="linkExcludes.includes(item.album$$q.id)"
                  >
                    {{ item.album$$q.title }}
                  </conditional-link>
                </v-list-item-title>
                <v-list-item-subtitle class="track-album-artist pl-4">
                  <conditional-link
                    :to="`/artists/${item.albumArtist$$q.id}`"
                    :disabled="linkExcludes.includes(item.albumArtist$$q.id)"
                  >
                    {{ item.albumArtist$$q.name }}
                  </conditional-link>
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <div class="list-column-duration numeric body-2">
              {{ item.formattedDuration$$q }}
            </div>
          </v-list-item>
          <template v-if="!item.isLast$$q">
            <v-divider />
          </template>
        </template>
      </template>
    </v-list-item-group>
  </v-list>
</template>

<style scoped>
.numeric {
  font-family: 'Open Sans', monospace !important;
  font-variant-numeric: slashed-zero lining-nums tabular-nums;
  line-height: 1 !important;
  white-space: nowrap;
  user-select: none;
}

.hover-container:not(:hover) .hover-display {
  display: none;
}

.hover-container:hover .hover-hidden {
  display: none;
}

.sheet-header {
  position: sticky;
  top: 48px;
  z-index: 1;
}

.list-header {
  height: 34px;
  user-select: none;
}

.list-header-column {
  align-self: flex-end;
  line-height: 1 !important;
}

.sheet-discnumber-header {
  position: sticky;
  top: calc(48px + 1px + 34px);
  z-index: 1;
}

.list-discnumber-header {
  height: 28px;
  padding: 0 14px !important;
}

.discnumber-text {
  padding-left: 2px;
  font-weight: 700;
}

.list-column-icon {
  width: 40px;
  text-align: center;
  line-height: 1 !important;
}

.icon-container {
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
}

.track-title,
.track-album-title {
  flex: auto 0 0;
  line-height: 1 !important;
  max-width: 100%;
}

.track-artist,
.track-album-artist {
  flex: auto 0 0;
  line-height: 1 !important;
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
