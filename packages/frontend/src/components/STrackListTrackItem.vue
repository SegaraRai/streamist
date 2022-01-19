<script lang="ts">
import type { PropType } from 'vue';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import { useTrackFilter } from '~/composables';
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

export const trackItemHeight = 56;

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
    showAlbum: Boolean,
    showArtist: Boolean,
    hideDuration: Boolean,
    removable: Boolean,
    selected: Boolean,
    disableCurrentPlaying: Boolean,
  },
  emits: {
    menu: (_event: MouseEvent) => true,
    ctxMenu: (_event: MouseEvent) => true,
    play: () => true,
    remove: () => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const playbackStore = usePlaybackStore();
    const themeStore = useThemeStore();
    const { isTrackAvailable$$q } = useTrackFilter();

    const isAvailable$$q = eagerComputed(() =>
      isTrackAvailable$$q(props.item.track$$q.id)
    );

    const isCurrentPlayingTrack$$q = eagerComputed(
      () =>
        !props.disableCurrentPlaying &&
        playbackStore.currentTrack$$q.value?.id === props.item.track$$q.id
    );

    return {
      t,
      isAvailable$$q,
      indexContentNumber$$q: eagerComputed(() =>
        props.indexContent === 'trackNumber'
          ? props.item.track$$q.trackNumber
          : props.indexContent === 'index'
          ? props.item.index$$q + 1
          : undefined
      ),
      themeStore$$q: themeStore,
      playing$$q: playbackStore.playing$$q,
      isCurrentPlayingTrack$$q,
      play$$q: (): void => {
        if (!isAvailable$$q.value) {
          return;
        }
        emit('play');
      },
      onContextMenu$$q: (event: MouseEvent): void => {
        emit('ctxMenu', event);
      },
      onMenu$$q: (event: MouseEvent): void => {
        emit('menu', event);
      },
      remove$$q: () => {
        emit('remove');
      },
    };
  },
});
</script>

<template>
  <v-list-item
    v-ripple
    v-bind="$attrs"
    class="s-hover-container s-list-item w-full py-1 h-14 !<sm:px-2"
    :class="[
      selected ? 's-list-item--selected' : 's-list-item--unselected',
      !isAvailable$$q && 'opacity-60',
    ]"
    @contextmenu.stop.prevent="onContextMenu$$q($event)"
  >
    <!-- Track Number -->
    <div class="s-track-list-column-icon mr-4">
      <div
        class="flex items-center justify-center"
        data-draggable="false"
        @dragstart.stop.prevent
      >
        <template v-if="isCurrentPlayingTrack$$q">
          <!-- 再生中（または一時停止中）の曲 -->
          <v-btn icon flat text class="bg-transparent" @click.stop="play$$q()">
            <v-icon class="s-hover-visible" :class="$style.icon">
              {{
                playing$$q
                  ? 'mdi-pause-circle-outline'
                  : 'mdi-play-circle-outline'
              }}
            </v-icon>
            <v-icon class="s-hover-hidden" :class="$style.icon">
              {{ playing$$q ? 'mdi-play-circle' : 'mdi-pause-circle' }}
            </v-icon>
          </v-btn>
        </template>
        <template v-else-if="isAvailable$$q">
          <!-- それ以外の曲 -->
          <v-btn icon flat text class="bg-transparent" @click.stop="play$$q()">
            <template v-if="indexContentNumber$$q != null">
              <div
                class="s-hover-hidden s-numeric font-medium tracking-[0.01em]"
              >
                {{ indexContentNumber$$q }}
              </div>
            </template>
            <template v-else-if="indexContent === 'albumArtwork'">
              <s-album-image-x
                class="s-hover-hidden flex-none w-9 h-9"
                size="36"
                :image="item.image$$q"
                :alt="item.album$$q.title"
              />
            </template>
            <v-icon class="s-hover-visible" :class="$style.icon">
              mdi-play-circle-outline
            </v-icon>
          </v-btn>
        </template>
        <template v-else>
          <!-- それ以外の曲（再生不可） -->
          <div>
            <template v-if="indexContentNumber$$q != null">
              <div class="s-numeric font-medium tracking-[0.01em]">
                {{ indexContentNumber$$q }}
              </div>
            </template>
            <template v-else-if="indexContent === 'albumArtwork'">
              <s-album-image-x
                class="flex-none w-9 h-9"
                size="36"
                :image="item.image$$q"
                :alt="item.album$$q.title"
              />
            </template>
          </div>
        </template>
      </div>
    </div>
    <!-- Track Title -->
    <v-list-item-header
      class="s-track-list-column-title flex flex-col flex-nowrap justify-center"
    >
      <v-list-item-title>
        <span
          class="s-heading-sl block max-w-max"
          :class="
            isCurrentPlayingTrack$$q
              ? 'text-st-primary'
              : isAvailable$$q
              ? 'cursor-pointer'
              : ''
          "
          @click.stop="!isCurrentPlayingTrack$$q && play$$q()"
        >
          {{ item.track$$q.title }}
        </span>
      </v-list-item-title>
      <template
        v-if="showArtist || item.artist$$q.id !== item.albumArtist$$q.id"
      >
        <v-list-item-subtitle class="!opacity-100">
          <s-conditional-link
            class="s-subheading-sl text-xs block max-w-max"
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
        class="s-track-list-column-album flex flex-col flex-nowrap justify-center ml-6 !<md:hidden"
      >
        <v-list-item-title>
          <s-conditional-link
            class="s-heading-sl block max-w-max"
            :to="`/albums/${item.album$$q.id}`"
            :disabled="linkExcludes?.includes(item.album$$q.id)"
          >
            {{ item.album$$q.title }}
          </s-conditional-link>
        </v-list-item-title>
        <v-list-item-subtitle class="!opacity-100">
          <s-conditional-link
            class="s-subheading-sl text-xs block max-w-max"
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
      <div class="s-track-list-column-duration s-duration body-2 !<sm:hidden">
        {{ item.formattedDuration$$q }}
      </div>
    </template>
    <!-- Remove icon -->
    <template v-if="removable">
      <div class="s-track-list-column-menu py-1">
        <v-btn
          icon
          flat
          text
          size="small"
          class="bg-transparent"
          data-draggable="false"
          @click.stop="remove$$q()"
          @dragstart.stop.prevent
        >
          <v-icon color="error" class="s-hover-visible">mdi-close</v-icon>
        </v-btn>
      </div>
    </template>
    <!-- Menu -->
    <div class="s-track-list-column-menu py-1">
      <v-btn
        icon
        flat
        text
        size="small"
        class="bg-transparent"
        data-draggable="false"
        @click.stop="!selected && onMenu$$q($event)"
        @dragstart.stop.prevent
      >
        <v-icon class="s-hover-visible">mdi-dots-vertical</v-icon>
      </v-btn>
    </div>
  </v-list-item>
</template>

<style module>
.icon {
  font-size: 32px !important;
  transition: all 0.1s ease-in-out;
  opacity: 0.9;
}

.icon:hover {
  font-size: 36px !important;
  opacity: 1;
}
</style>
