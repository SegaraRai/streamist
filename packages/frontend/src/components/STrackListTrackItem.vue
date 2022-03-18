<script lang="ts">
import type { PropType } from 'vue';
import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourceTrack,
} from '$/types';
import { useTrackFilter } from '~/composables';
import { RENDER_DELAY_TRACK_LIST_ITEM } from '~/config';
import { usePlaybackStore } from '~/stores/playback';

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
  inheritAttrs: false,
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
    const { isTrackAvailable$$q } = useTrackFilter();

    const isAvailable$$q = computedEager(() =>
      isTrackAvailable$$q(props.item.track$$q.id)
    );
    const isCurrentPlayingTrack$$q = computedEager(
      () =>
        !props.disableCurrentPlaying &&
        playbackStore.currentTrack$$q.value === props.item.track$$q.id
    );

    const readyToRender$$q = ref(false);
    onMounted(() => {
      setTimeout(() => {
        requestAnimationFrame(() => {
          readyToRender$$q.value = true;
        });
      }, RENDER_DELAY_TRACK_LIST_ITEM);
    });

    return {
      t,
      isAvailable$$q,
      indexContentNumber$$q: computedEager(() =>
        props.indexContent === 'trackNumber'
          ? props.item.track$$q.trackNumber
          : props.indexContent === 'index'
          ? props.item.index$$q + 1
          : undefined
      ),
      readyToRender$$q,
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
  <div
    v-ripple="readyToRender$$q"
    v-bind="$attrs"
    class="s-hover-container s-list-item w-full px-2 py-1 h-14 flex"
    :class="[
      selected ? 's-list-item--selected' : 's-list-item--unselected',
      !isAvailable$$q && 'opacity-60',
    ]"
    @contextmenu.stop.prevent="onContextMenu$$q($event)"
  >
    <!-- Track Number -->
    <div class="s-track-list-column-icon mr-2">
      <div
        class="flex items-center justify-center h-full"
        data-draggable="false"
        @dragstart.stop.prevent
      >
        <template v-if="readyToRender$$q">
          <template v-if="isCurrentPlayingTrack$$q">
            <!-- 再生中（または一時停止中）の曲 -->
            <VBtn icon flat text class="bg-transparent" @click.stop="play$$q()">
              <VIcon class="s-hover-visible" :class="$style.icon">
                {{
                  playing$$q
                    ? 'mdi-pause-circle-outline'
                    : 'mdi-play-circle-outline'
                }}
              </VIcon>
              <VIcon class="s-hover-hidden" :class="$style.icon">
                {{ playing$$q ? 'mdi-play-circle' : 'mdi-pause-circle' }}
              </VIcon>
            </VBtn>
          </template>
          <template v-else-if="isAvailable$$q">
            <!-- それ以外の曲 -->
            <VBtn
              icon
              flat
              text
              class="bg-transparent text-center !indent-0px"
              @click.stop="play$$q()"
            >
              <template v-if="indexContentNumber$$q != null">
                <div
                  class="s-hover-hidden s-numeric font-medium tracking-[0.01em]"
                >
                  {{ indexContentNumber$$q }}
                </div>
              </template>
              <template v-else-if="indexContent === 'albumArtwork'">
                <SAlbumImageX
                  class="s-hover-hidden flex-none w-9 h-9"
                  size="36"
                  :image="item.image$$q"
                  :alt="item.album$$q.title"
                />
              </template>
              <VIcon class="s-hover-visible" :class="$style.icon">
                mdi-play-circle-outline
              </VIcon>
            </VBtn>
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
                <SAlbumImageX
                  class="flex-none w-9 h-9"
                  size="36"
                  :image="item.image$$q"
                  :alt="item.album$$q.title"
                />
              </template>
            </div>
          </template>
        </template>
        <template v-else>
          <template v-if="indexContentNumber$$q != null">
            <div class="s-numeric font-medium tracking-[0.01em] text-base">
              {{ indexContentNumber$$q }}
            </div>
          </template>
          <template v-else-if="indexContent === 'albumArtwork'">
            <div class="w-9 h-9 s-lazyload-background m-auto"></div>
          </template>
        </template>
      </div>
    </div>
    <!-- Track Title -->
    <div
      class="s-track-list-column-title flex flex-col flex-nowrap justify-center"
    >
      <div
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
      </div>
      <template
        v-if="showArtist || item.artist$$q.id !== item.albumArtist$$q.id"
      >
        <SConditionalLink
          class="s-subheading-sl text-xs block max-w-max"
          :to="`/artists/${item.artist$$q.id}`"
          :disabled="linkExcludes?.includes(item.artist$$q.id)"
        >
          {{ item.artist$$q.name }}
        </SConditionalLink>
      </template>
    </div>
    <!-- Album Title -->
    <template v-if="showAlbum">
      <div
        class="s-track-list-column-album flex flex-col flex-nowrap justify-center ml-6 !<md:hidden"
      >
        <SConditionalLink
          class="s-heading-sl block max-w-max"
          :to="`/albums/${item.album$$q.id}`"
          :disabled="linkExcludes?.includes(item.album$$q.id)"
        >
          {{ item.album$$q.title }}
        </SConditionalLink>
        <SConditionalLink
          class="s-subheading-sl text-xs block max-w-max"
          :to="`/artists/${item.albumArtist$$q.id}`"
          :disabled="linkExcludes?.includes(item.albumArtist$$q.id)"
        >
          {{ item.albumArtist$$q.name }}
        </SConditionalLink>
      </div>
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
        <VBtn
          icon
          flat
          text
          size="small"
          class="bg-transparent"
          data-draggable="false"
          @click.stop="remove$$q()"
          @dragstart.stop.prevent
        >
          <VIcon color="error" class="s-hover-visible">mdi-close</VIcon>
        </VBtn>
      </div>
    </template>
    <!-- Menu -->
    <div class="s-track-list-column-menu py-1 ml-1">
      <template v-if="readyToRender$$q">
        <VBtn
          icon
          flat
          text
          size="small"
          class="bg-transparent"
          data-draggable="false"
          @click.stop="!selected && onMenu$$q($event)"
          @dragstart.stop.prevent
        >
          <VIcon class="s-hover-visible">mdi-dots-vertical</VIcon>
        </VBtn>
      </template>
    </div>
  </div>
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
