<script lang="ts">
import type { PropType } from 'vue';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import { usePlaybackStore } from '~/stores/playback';
import { useThemeStore } from '~/stores/theme';

/**
 * インデックスのところに表示する内容
 */
export type IndexContent = 'none' | 'index' | 'trackNumber' | 'albumArtwork';

export interface ListItemTrack {
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

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<ListItemTrack>,
      required: true,
    },
    indexContent: {
      type: String as PropType<IndexContent>,
      default: 'trackNumber',
    },
    linkExcludes: {
      type: Array as PropType<readonly string[] | undefined>,
      default: undefined,
    },
    setList: {
      type: Array as PropType<readonly ResourceTrack[] | null | undefined>,
      default: undefined,
    },
    showAlbum: Boolean,
    showArtist: Boolean,
    hideDuration: Boolean,
    selected: Boolean,
  },
  emits: {
    menu: (_event: MouseEvent) => true,
    ctxMenu: (_event: MouseEvent) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const themeStore = useThemeStore();

    const currentPlayingTrackId = eagerComputed(
      () => playbackStore.currentTrack$$q.value?.id
    );

    return {
      t,
      themeStore$$q: themeStore,
      playing$$q: playbackStore.playing$$q,
      currentPlayingTrackId$$q: currentPlayingTrackId,
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
      onContextMenu$$q: (event: MouseEvent): void => {
        emit('ctxMenu', event);
      },
      onMenu$$q: (event: MouseEvent): void => {
        emit('menu', event);
      },
    };
  },
});
</script>

<template>
  <div>
    <v-list-item
      class="s-hover-container s-track-list-item w-full py-1 h-14 !<sm:px-2"
      :class="
        selected
          ? 's-track-list-item--selected'
          : 's-track-list-item--unselected'
      "
      :ripple="false"
      @contextmenu.prevent="onContextMenu$$q($event)"
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
          v-if="showArtist || item.artist$$q.id !== item.albumArtist$$q.id"
        >
          <v-list-item-subtitle class="track-artist">
            <s-conditional-link
              class="block overflow-hidden overflow-ellipsis max-w-max"
              :to="`/artists/${item.artist$$q.id}`"
              :disabled="linkExcludes?.includes(item.artist$$q.id)"
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
              :disabled="linkExcludes?.includes(item.album$$q.id)"
            >
              {{ item.album$$q.title }}
            </s-conditional-link>
          </v-list-item-title>
          <v-list-item-subtitle class="track-album-artist">
            <s-conditional-link
              class="block overflow-hidden overflow-ellipsis max-w-max"
              :to="`/artists/${item.albumArtist$$q.id}`"
              :disabled="linkExcludes?.includes(item.albumArtist$$q.id)"
            >
              {{ item.albumArtist$$q.name }}
            </s-conditional-link>
          </v-list-item-subtitle>
        </v-list-item-header>
      </template>
      <!-- Duration -->
      <template v-if="!hideDuration">
        <div class="list-column-duration s-duration body-2 !<sm:hidden">
          {{ item.formattedDuration$$q }}
        </div>
      </template>
      <!-- Menu -->
      <div class="list-header-column list-column-menu py-1">
        <v-btn
          icon
          flat
          text
          size="small"
          :disabled="!setList"
          class="bg-transparent"
          @click.stop="onMenu$$q($event)"
        >
          <v-icon class="s-hover-visible"> mdi-dots-vertical </v-icon>
        </v-btn>
      </div>
    </v-list-item>
    <!-- Divider -->
    <template v-if="!item.isLast$$q">
      <v-divider />
    </template>
  </div>
</template>
