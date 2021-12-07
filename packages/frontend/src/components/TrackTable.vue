<script lang="ts">
import Vue from 'vue';
import { DataTableHeader } from 'vuetify';
import {
  Ref,
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  watch,
} from '@vue/composition-api';
import {
  /*type*/ AlbumDTO,
  ArtistDTO,
  ArtistNameDTO,
} from '@streamist/shared/lib/dto/db.dto';
import { getArtist } from '@/lib/artist';
import { /*type*/ TrackDTOForPlayback } from '@/lib/dto';
import { formatTime } from '@/lib/formatTime';
import { usePlaybackStore } from '@/stores/playback';

export type ColumnKey =
  | 'index'
  | 'title'
  | 'artist'
  | 'album'
  | 'discNumber'
  | 'duration'
  | 'actions';

interface Props {
  tracks?: TrackDTOForPlayback[] | null;
  excludes: ColumnKey[];
  showDiscNumber: boolean;
  hideIndex: boolean;
  linkExcludes: string[];
  disableSort: boolean;
  loading: boolean;
  setList?: TrackDTOForPlayback[] | null;
}

interface ListItem {
  index: number;
  track: TrackDTOForPlayback;
  artistName: ArtistNameDTO;
  artist?: ArtistDTO;
  artistOrArtistName: ArtistDTO | ArtistNameDTO;
  album: AlbumDTO;
  albumArtist: ArtistNameDTO;
  //
  colTitle: string;
  colArtist: string;
  colAlbum: string;
  colDiscNumber: number;
  colDuration: number;
  colActions: '';
}

interface HeaderColumn extends DataTableHeader {
  _columnKey: ColumnKey;
}

const baseColumns: HeaderColumn[] = [
  {
    _columnKey: 'index',
    text: 'Index',
    value: 'index',
    class: 'column-index',
    align: 'center',
    sortable: false,
  },
  {
    _columnKey: 'title',
    text: 'Title',
    value: 'colTitle',
    class: 'column-title',
  },
  {
    _columnKey: 'artist',
    text: 'Artist',
    value: 'colArtist',
    class: 'column-artist',
  },
  {
    _columnKey: 'album',
    text: 'Album',
    value: 'colAlbum',
    class: 'column-album',
  },
  {
    _columnKey: 'discNumber',
    text: 'Disc Number',
    value: 'colDiscNumber',
    class: 'column-discnumber',
    align: 'center',
  },
  {
    _columnKey: 'duration',
    text: 'Duration',
    value: 'colDuration',
    class: 'column-duration',
    align: 'end',
  },
  {
    _columnKey: 'actions',
    text: 'Actions',
    value: 'colActions',
    class: 'column-actions',
    align: 'center',
    sortable: false,
  },
];

export default defineComponent({
  props: {
    tracks: {
      type: Array,
      required: false,
    },
    excludes: {
      type: Array,
      default: (): ColumnKey[] => [],
    },
    showDiscNumber: Boolean,
    hideIndex: Boolean,
    linkExcludes: {
      type: Array,
      default: (): string[] => [],
    },
    disableSort: {
      type: Boolean,
    },
    loading: Boolean,
    setList: {
      type: Array,
      required: false,
    },
  },
  setup(_props) {
    const props = (_props as unknown) as Props;

    const playbackStore = usePlaybackStore();

    //

    const tables = (ref(null) as unknown) as Ref<Vue[]>;

    const tableScrollX = ref(0);

    onMounted(() => {
      for (const table of tables.value) {
        const tableWrapper = table.$el.querySelector('.v-data-table__wrapper')!;
        tableWrapper.addEventListener('scroll', () => {
          tableScrollX.value = tableWrapper.scrollLeft;
        });
        tableWrapper.addEventListener('resize', () => {
          tableScrollX.value = tableWrapper.scrollLeft;
        });
      }
    });

    watch(
      tableScrollX,
      (newTableScrollX) => {
        if (!tables.value) {
          return;
        }

        for (const table of tables.value) {
          const tableWrapper = table.$el.querySelector(
            '.v-data-table__wrapper'
          )!;
          tableWrapper.scrollLeft = newTableScrollX;
        }
      },
      {
        immediate: true,
      }
    );

    //

    const useDiscNumber = computed(
      () =>
        (props.showDiscNumber &&
          props.tracks?.some((track) => track.discNumber !== 1)) ||
        false
    );

    const items = computed(() => {
      return (
        props.tracks?.map(
          (track, index): ListItem => {
            const artist = getArtist(track.artistName!);

            return {
              index,
              track,
              album: track.album!,
              artistName: track.artistName!,
              artist,
              artistOrArtistName: artist || track.artistName!,
              albumArtist: track.album!.artistName!,
              colTitle: track.titleSort || track.title,
              colArtist: track.artistName!.nameSort || track.artistName!.name,
              colAlbum: track.album!.titleSort || track.album!.title,
              colDiscNumber: track.discNumber,
              colDuration: track.duration,
              colActions: '',
            };
          }
        ) || []
      );
    });

    const headers = computed((): DataTableHeader[] => {
      const excludeSet = new Set(props.excludes);
      if (!useDiscNumber.value) {
        excludeSet.add('discNumber');
      }
      return baseColumns
        .filter(({ _columnKey }) => !excludeSet.has(_columnKey))
        .map((column) => ({
          ...column,
          _columnKey: undefined,
        }));
    });

    //

    const currentPlayingTrackId = computed(() => {
      return playbackStore.currentTrack$$q.value?.id;
    });

    //

    const tableOptions = reactive({
      page: 0, // 使わないので適当
      itemsPerPage: 10, // 使わないので適当
      sortBy: [],
      sortDesc: [],
      groupBy: ['colDiscNumber'],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    });

    const selected = reactive([] as string[]);

    //

    return {
      tables,
      playing$$q: playbackStore.playing$$q,
      s: selected, // v-modelに対してはマングリングできない
      headers$$q: headers,
      items$$q: items,
      tableOptions$$q: tableOptions,
      currentPlayingTrackId$$q: currentPlayingTrackId,
      formatTime$$q: formatTime,
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
  <div>
    <div>
      <template v-for="type in ['header', 'body']">
        <v-data-table
          ref="tables"
          :key="type"
          v-model="s"
          :headers="headers$$q"
          :items="items$$q"
          item-key="index"
          disable-pagination
          :disable-sort="disableSort"
          hide-default-footer
          :mobile-breakpoint="0"
          show-select
          :options.sync="tableOptions$$q"
          class="track-table"
          :class="`track-table-${type}`"
        >
          <!-- ディスク番号グループ -->
          <template #group.header="{ headers, items }">
            <td
              class="discnumber-header"
              :colspan="headers.length"
              :hidden="!useDiscNumber$$q"
            >
              <div class="d-flex align-center">
                <v-icon>mdi-disc</v-icon>
                <span>{{ items[0].track.discNumber }}</span>
              </div>
            </td>
          </template>
          <!-- ヘッダー -->
          <template #header.index>#</template>
          <template #header.colDiscNumber>
            <v-icon>mdi-disc</v-icon>
          </template>
          <template #header.colDuration>
            <v-icon>mdi-clock-outline</v-icon>
          </template>
          <template #header.colActions></template>
          <!-- セル -->
          <template #item.index="{ item }" class="px-0">
            <!-- hiddenを切り替えるのとv-ifとどっちがいいか -->
            <div v-show="currentPlayingTrackId$$q === item.track.id">
              <!-- 再生中（または一時停止中）の曲 -->
              <v-btn
                icon
                text
                :disabled="!setList"
                @click="play$$q(item.track)"
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
            <div v-show="currentPlayingTrackId$$q !== item.track.id">
              <!-- それ以外の曲 -->
              <v-btn
                icon
                text
                :disabled="!setList"
                @click="play$$q(item.track)"
              >
                <template v-if="!hideIndex">
                  <div class="index hover-hidden">
                    {{ item.track.trackNumber }}
                  </div>
                </template>
                <v-icon class="play-icon hover-display">
                  mdi-play-circle-outline
                </v-icon>
              </v-btn>
            </div>
          </template>
          <template #item.colTitle="{ item }">
            <div class="cell cell-title">
              <span :title="item.track.title">
                {{ item.track.title }}
              </span>
            </div>
          </template>
          <template #item.colArtist="{ item }">
            <div class="cell cell-artist">
              <template
                v-if="!linkExcludes.includes(item.artistOrArtistName.id)"
              >
                <router-link
                  :to="`/artists/${item.artistOrArtistName.id}`"
                  :title="item.artistOrArtistName.name"
                >
                  {{ item.artistOrArtistName.name }}
                </router-link>
              </template>
              <template v-else>
                <span :title="item.artistOrArtistName.name">
                  {{ item.artistOrArtistName.name }}
                </span>
              </template>
            </div>
          </template>
          <template #item.colAlbum="{ item }">
            <div class="cell cell-album">
              <template v-if="!linkExcludes.includes(item.album.id)">
                <router-link
                  :to="`/albums/${item.album.id}`"
                  :title="item.album.title"
                >
                  {{ item.album.title }}
                </router-link>
              </template>
              <template v-else>
                <span :title="item.album.title">
                  {{ item.album.title }}
                </span>
              </template>
            </div>
          </template>
          <template #item.colDiscNumber="{ item }">
            <div class="cell cell-disc-number">
              {{ item.track.discNumber }}
            </div>
          </template>
          <template #item.colDuration="{ item }">
            <div class="cell cell-duration">
              {{ formatTime$$q(item.track.duration) }}
            </div>
          </template>
          <template #item.colActions>
            <v-btn icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
        </v-data-table>
        <v-divider :key="type + 'd'"></v-divider>
      </template>
    </div>
  </div>
</template>

<style>
.track-table table {
  table-layout: auto;
}

.track-table-header tbody,
.track-table-body thead {
  visibility: collapse;
}

.track-table .column-index {
  width: 70px;
}

.track-table .column-title {
  max-width: 50%;
}

.track-table .column-album {
  max-width: 20%;
}

.track-table .column-artist {
  max-width: 20%;
}

.track-table .column-duration {
  width: 100px;
}

.track-table .column-actions {
  width: 70px;
}

.discnumber-header {
  height: 34px !important;
  padding: 0 10px !important;
  font-family: 'Open Sans', monospace !important;
  font-variant-numeric: slashed-zero lining-nums tabular-nums;
  line-height: 1 !important;
  white-space: nowrap;
  user-select: none;
}
</style>

<style scoped>
.track-table tbody tr:not(:hover) .hover-display {
  display: none;
}

.track-table tbody tr:hover .hover-hidden {
  display: none;
}

.track-table {
  border-radius: 0 !important;
}

.track-table-header {
  position: sticky;
  top: 48px;
  z-index: 1;
}

.cell {
  white-space: nowrap;
}

.cell-title,
.cell-album,
.cell-artist {
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-title {
  max-width: 40vw;
  min-width: 200px;
}

.play-icon {
  font-size: 32px !important;
  transition: font-size 0s;
  opacity: 0.7;
}

.play-icon:hover {
  font-size: 36px !important;
  opacity: initial;
}

.index,
.cell-duration {
  font-family: 'Open Sans', monospace !important;
  font-variant-numeric: slashed-zero lining-nums tabular-nums;
  line-height: 1 !important;
  white-space: nowrap;
  user-select: none;
}

.index {
  font-weight: 600;
  letter-spacing: 0.01em !important;
}
</style>
