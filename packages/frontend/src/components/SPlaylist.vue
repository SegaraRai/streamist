<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { filterNullAndUndefined } from '$shared/filter';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { useLiveQuery, useTrackFilter } from '~/composables';
import { db, useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { formatTracksTotalDuration } from '~/logic/duration';
import { usePlaybackStore } from '~/stores/playback';
import type { DropdownPlaylistInput } from './SDropdownPlaylist.vue';

export default defineComponent({
  props: {
    playlist: {
      type: [String, Object] as PropType<string | ResourcePlaylist>,
      required: true,
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
  },
  emits: {
    trackLoad: (_tracks: readonly ResourceTrack[]) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const message = useMessage();
    const syncDB = useSyncDB();
    const playbackStore = usePlaybackStore();
    const { isTrackAvailable$$q } = useTrackFilter();

    const playlistId$$q = computedEager(() =>
      typeof props.playlist === 'string' ? props.playlist : props.playlist.id
    );

    const propPlaylistRef = computedEager(() => props.playlist);
    const { value } = useLiveQuery(
      async () => {
        const propPlaylist = propPlaylistRef.value;
        const playlist$$q =
          typeof propPlaylist === 'string'
            ? await db.playlists.get(propPlaylist)
            : propPlaylist;
        if (!playlist$$q) {
          throw new Error(`Playlist ${propPlaylist} not found`);
        }
        const tracks$$q = filterNullAndUndefined(
          await db.tracks.bulkGet(playlist$$q.trackIds as string[])
        );
        if (propPlaylistRef.value !== propPlaylist) {
          throw new Error('operation aborted');
        }
        emit('trackLoad', tracks$$q);
        return {
          playlist$$q,
          tracks$$q,
        };
      },
      [propPlaylistRef],
      true
    );

    const availableTracks = computed(() =>
      value.value?.tracks$$q.filter((track) => isTrackAvailable$$q(track.id))
    );

    const duration = computedEager(
      () =>
        value.value &&
        formatTracksTotalDuration(
          value.value.tracks$$q,
          t('vendor.humanizeDuration.language')
        )
    );

    const dropdown$$q = ref<DropdownPlaylistInput | undefined>();

    return {
      t,
      playlistId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      availableTracks$$q: availableTracks,
      duration$$q: duration,
      play$$q: (shuffle?: boolean): void => {
        if (!value.value?.tracks$$q.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(
          value.value.playlist$$q.title,
          value.value.tracks$$q.map((track) => track.id)
        );
      },
      onMove$$q: async (
        track: ResourceTrack,
        nextTrack: ResourceTrack | undefined
      ): Promise<void> => {
        try {
          await api.my.playlists
            ._playlistId(playlistId$$q.value)
            .tracks._trackId(track.id)
            .patch({
              body: {
                nextTrackId: nextTrack?.id ?? null,
              },
            });

          message.success(t('message.ReorderedTrack'));

          syncDB();
        } catch (error) {
          message.error(t('message.FailedToReorderTrack', [String(error)]));
        }
      },
      dropdown$$q,
      openMenu$$q: (target: MouseEvent | HTMLElement) => {
        if (!value.value) {
          return;
        }

        dropdown$$q.value = {
          target$$q: target,
          playlist$$q: value.value.playlist$$q,
          tracks$$q: value.value.tracks$$q,
        };
      },
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <div
      class="mb-6 <md:mt-4 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-5"
    >
      <!-- w-50 h-50 is needed to prevent layout shift -->
      <div class="p-0 m-0 w-50 h-50 leading-none flex-none">
        <template v-if="linkExcludes.includes(playlistId$$q)">
          <SImageManager
            attach-to-type="playlist"
            :attach-to-id="playlistId$$q"
            :attach-to-title="value$$q.playlist$$q.title"
            :image-ids="imageIds$$q"
            @contextmenu.prevent="openMenu$$q($event)"
          >
            <template #title>
              {{
                t('imageManager.title.playlist', [value$$q.playlist$$q.title])
              }}
            </template>
            <SPlaylistImage
              class="w-50 h-50"
              size="200"
              expandable
              :playlist="playlistId$$q"
              @image-ids="imageIds$$q = $event"
            />
          </SImageManager>
        </template>
        <template v-else>
          <RouterLink :to="`/playlists/${playlistId$$q}`" class="block">
            <SPlaylistImage
              class="w-50 h-50"
              size="200"
              expandable
              :playlist="value$$q.playlist$$q"
              @image-ids="imageIds$$q = $event"
              @contextmenu.prevent="openMenu$$q($event)"
            />
          </RouterLink>
        </template>
      </div>
      <div class="flex flex-col <md:gap-y-3 <md:text-center">
        <div class="s-heading font-bold text-xl flex-none line-clamp-2">
          <SConditionalLink
            :to="`/playlists/${playlistId$$q}`"
            :disabled="linkExcludes.includes(playlistId$$q)"
            @contextmenu.prevent="openMenu$$q($event)"
          >
            {{ value$$q?.playlist$$q.title }}
          </SConditionalLink>
        </div>
        <template v-if="value$$q?.playlist$$q.description">
          <div>{{ value$$q?.playlist$$q.description }}</div>
        </template>
        <div class="flex-1 <md:hidden"></div>
        <div class="s-subheading-sl flex-none text-sm">
          <span>
            {{ t('playlist.n_tracks', value$$q.tracks$$q.length) }}
          </span>
          <template v-if="value$$q.tracks$$q.length">
            <span v-show="duration$$q">, {{ duration$$q }}</span>
          </template>
        </div>
      </div>
    </div>
    <div class="flex-none flex flex-row items-center gap-x-8 my-8">
      <VBtn
        color="primary"
        icon
        :disabled="!availableTracks$$q?.length"
        @click="play$$q(false)"
      >
        <i-mdi-play />
      </VBtn>
      <VBtn
        outlined
        :disabled="!availableTracks$$q?.length"
        @click="play$$q(true)"
      >
        <i-mdi-shuffle />
        <span class="pl-1">
          {{ t('playlist.Shuffle') }}
        </span>
      </VBtn>
      <button
        class="rounded-full transition-colors flex items-center"
        @click="openMenu$$q($event.target as HTMLElement)"
      >
        <i-mdi-dots-vertical />
      </button>
      <VDivider />
    </div>
    <STrackList
      render-mode="draggable"
      show-album
      show-artist
      :tracks="value$$q?.tracks$$q"
      :link-excludes="linkExcludes"
      index-content="index"
      :set-list="value$$q?.tracks$$q"
      :set-list-name="value$$q?.playlist$$q.title"
      :playlist-id="playlistId$$q"
      visit-album
      visit-artist
      :on-move="onMove$$q"
    />
    <SDropdownPlaylist v-model="dropdown$$q" />
  </template>
</template>
