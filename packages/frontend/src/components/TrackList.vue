<script lang="ts">
import { computed, defineComponent, reactive } from '@vue/composition-api';
import {
  /*type*/ ArtistDTO,
  ArtistNameDTO,
} from '@streamist/shared/lib/dto/db.dto';
import NullableImage from '@/components/NullableImage.vue';
import { getArtist } from '@/lib/artist';
import {
  /*type*/ AlbumDTOForPlayback,
  ArtistNameDTOWithArtists,
  ImageDTOWithImageFiles,
  TrackDTOForPlayback,
} from '@/lib/dto';
import { formatTime } from '@/lib/formatTime';
import { getDefaultImage } from '@/lib/image';
import { usePlaybackStore } from '@/stores/playback';
import { useStyleStore } from '@/stores/style';

/**
 * インデックスのところに表示する内容
 */
export type IndexContent = 'none' | 'index' | 'trackNumber' | 'albumArtwork';

interface Props {
  tracks?: TrackDTOForPlayback[] | null;
  showDiscNumber: boolean;
  indexContent: IndexContent;
  linkExcludes: string[];
  loading: boolean;
  setList?: TrackDTOForPlayback[] | null;
  showAlbum: boolean;
  showArtist: boolean;
}

interface ListItemTrack {
  type$$q: 'track';
  index$$q: number;
  track$$q: TrackDTOForPlayback;
  artistName$$q: ArtistNameDTOWithArtists;
  artistOrArtistName$$q: ArtistDTO | ArtistNameDTO;
  album$$q: AlbumDTOForPlayback;
  albumArtistName$$q: ArtistNameDTOWithArtists;
  albumArtistOrArtistName$$q: ArtistDTO | ArtistNameDTO;
  formattedDuration$$q: string;
  image$$q: ImageDTOWithImageFiles | undefined;
  isLast$$q: boolean;
}

interface ListItemDiscNumberHeader {
  type$$q: 'discNumberHeader';
  discNumber$$q: number;
}

type ListItem = ListItemTrack | ListItemDiscNumberHeader;

export default defineComponent({
  components: {
    NullableImage,
  },
  props: {
    tracks: {
      type: Array,
      required: false,
    },
    showDiscNumber: Boolean,
    indexContent: {
      type: String,
      default: 'trackNumber',
    },
    linkExcludes: {
      type: Array,
      default: (): string[] => [],
    },
    loading: Boolean,
    setList: {
      type: Array,
      required: false,
    },
    showAlbum: Boolean,
    showArtist: Boolean,
  },
  setup(_props) {
    const props = (_props as unknown) as Props;

    const playbackStore = usePlaybackStore();
    const styleStore = useStyleStore();

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
        (track, index): ListItemTrack => {
          const { album, artistName } = track;
          const albumArtistName = album.artistName;
          const artist = getArtist(artistName);
          const albumArtist = getArtist(albumArtistName);

          return {
            type$$q: 'track',
            index$$q: index,
            track$$q: track,
            album$$q: album,
            artistName$$q: artistName,
            artistOrArtistName$$q: artist || artistName,
            albumArtistName$$q: albumArtistName,
            albumArtistOrArtistName$$q: albumArtist || albumArtistName,
            formattedDuration$$q: formatTime(track.duration),
            image$$q: getDefaultImage(album.images, album.imageOrder),
            isLast$$q: index === tracks.length - 1,
          };
        }
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
      imageSize$$q: 32,
      styleStore$$q: styleStore,
      playing$$q: playbackStore.playing$$q,
      s: selected, // v-modelに対してはマングリングできない
      items$$q: items,
      currentPlayingTrackId$$q: currentPlayingTrackId,
      useDiscNumber$$q: useDiscNumber,
      play$$q: (track: TrackDTOForPlayback): void => {
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
  <v-list flat :class="styleStore$$q.backgroundClassContent$$q.value">
    <v-list-item-group v-model="s" multiple>
      <v-sheet
        tile
        class="sheet-header"
        :class="styleStore$$q.backgroundClassContent$$q.value"
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
              $t('tracklist/Title')
            }}</v-list-item-title>
          </v-list-item-content>
          <template v-if="showAlbum">
            <v-list-item-content
              class="list-header-column list-column-content d-flex flex-row flex-nowrap mr-6 py-2"
            >
              <v-list-item-title class="track-album-title subtitle-2">{{
                $t('tracklist/Album')
              }}</v-list-item-title>
            </v-list-item-content>
          </template>
          <div class="list-header-column list-column-duration py-1">
            <v-icon>mdi-clock-outline</v-icon>
          </div>
        </v-subheader>
        <v-divider />
      </v-sheet>
      <template v-for="(item, index) in items$$q">
        <template v-if="item.type$$q === 'discNumberHeader'">
          <v-sheet
            :key="index"
            tile
            class="sheet-discnumber-header"
            :class="styleStore$$q.backgroundClassContent$$q.value"
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
          <v-list-item :key="index" class="hover-container" :ripple="false">
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
                  // eslint-disable vue/html-indent
                  showArtist ||
                  item.artistName$$q.id !== item.albumArtistName$$q.id
                  // eslint-enable vue/html-indent
                "
              >
                <v-list-item-subtitle class="track-artist pl-4">
                  <template
                    v-if="!linkExcludes.includes(item.artistOrArtistName$$q.id)"
                  >
                    <router-link
                      :to="`/artists/${item.artistOrArtistName$$q.id}`"
                    >
                      {{ item.artistName$$q.name }}
                    </router-link>
                  </template>
                  <template v-else>
                    <span>{{ item.artistName$$q.name }}</span>
                  </template>
                </v-list-item-subtitle>
              </template>
            </v-list-item-content>
            <template v-if="showAlbum">
              <v-list-item-content
                class="list-column-content d-flex flex-row flex-nowrap mr-6"
              >
                <v-list-item-title class="track-album-title">
                  <template v-if="!linkExcludes.includes(item.album$$q.id)">
                    <router-link :to="`/albums/${item.album$$q.id}`">{{
                      item.album$$q.title
                    }}</router-link>
                  </template>
                  <template v-else>
                    <span>{{ item.album$$q.title }}</span>
                  </template>
                </v-list-item-title>
                <v-list-item-subtitle class="track-album-artist pl-4">
                  <template
                    v-if="
                      !linkExcludes.includes(item.albumArtistOrArtistName$$q.id)
                    "
                  >
                    <router-link
                      :to="`/artists/${item.albumArtistOrArtistName$$q.id}`"
                    >
                      {{ item.albumArtistName$$q.name }}
                    </router-link>
                  </template>
                  <template v-else>
                    <span>{{ item.albumArtistName$$q.name }}</span>
                  </template>
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
            <div class="list-column-duration numeric body-2">
              {{ item.formattedDuration$$q }}
            </div>
          </v-list-item>
          <template v-if="!item.isLast$$q">
            <v-divider :key="'d-' + index"></v-divider>
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
