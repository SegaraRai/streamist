<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourcePlaylist, ResourceTrack } from '$/types';
import { db } from '~/db';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';
import { formatTracksTotalDuration } from '~/logic/duration';
import { useMenu } from '~/logic/menu';
import { createPlaylistDropdown } from '~/logic/naive-ui/playlistDropdown';
import { useLiveQuery } from '~/logic/useLiveQuery';
import { usePlaybackStore } from '~/stores/playback';

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

    const playlistId$$q = eagerComputed(() =>
      typeof props.playlist === 'string' ? props.playlist : props.playlist.id
    );

    const propPlaylistRef = eagerComputed(() => props.playlist);
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
        const tracks$$q = (await db.tracks.bulkGet(
          playlist$$q.trackIds as string[]
        )) as readonly ResourceTrack[];
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

    const duration = eagerComputed(
      () => value.value && formatTracksTotalDuration(value.value.tracks$$q)
    );

    const dialog$$q = ref(false);

    const {
      x$$q: menuX$$q,
      y$$q: menuY$$q,
      isOpen$$q: menuIsOpen$$q,
      close$$q: closeMenu$$q,
      open$$q: openMenu$$q,
    } = useMenu({
      closeOnScroll$$q: true,
    });
    const menuOptions$$q = createPlaylistDropdown({
      playlist$$q: eagerComputed(() => value.value?.playlist$$q),
      playlistTracks$$q: eagerComputed(() => value.value?.tracks$$q),
      moveWhenDelete$$q: ref(true),
      openEditPlaylistDialog$$q: () => {
        dialog$$q.value = true;
      },
      closeMenu$$q,
    });

    return {
      t,
      playlistId$$q,
      imageIds$$q: ref<readonly string[] | undefined>(),
      value$$q: value,
      duration$$q: duration,
      play$$q: (shuffle?: boolean): void => {
        if (!value.value?.tracks$$q.length) {
          return;
        }
        if (shuffle !== undefined) {
          playbackStore.shuffle$$q.value = shuffle;
        }
        playbackStore.setSetListAndPlayAuto$$q(value.value.tracks$$q);
      },
      onMove$$q: (
        track: ResourceTrack,
        nextTrack: ResourceTrack | undefined
      ): void => {
        api.my.playlists
          ._playlistId(playlistId$$q.value)
          .tracks._trackId(track.id)
          .patch({
            body: {
              nextTrackId: nextTrack?.id ?? null,
            },
          })
          .then(() => {
            message.success(t('message.ReorderedTrack'));
            syncDB();
          })
          .catch((error) => {
            message.error(t('message.FailedToReorderTrack', [String(error)]));
          });
      },
      dialog$$q,
      menuOptions$$q,
      menuIsOpen$$q,
      menuX$$q,
      menuY$$q,
      openMenu$$q,
      closeMenu$$q,
    };
  },
});
</script>

<template>
  <template v-if="value$$q">
    <div
      class="mb-6 flex flex-col items-center md:flex-row md:items-stretch gap-x-8 gap-y-6 md:gap-y-4"
    >
      <div class="p-0 m-0 leading-none">
        <template v-if="linkExcludes.includes(playlistId$$q)">
          <s-image-manager
            attach-to-type="playlist"
            :attach-to-id="playlistId$$q"
            :attach-to-title="value$$q.playlist$$q.title"
            :image-ids="imageIds$$q"
            @contextmenu.prevent="openMenu$$q($event)"
          >
            <template #title>
              Artwork of Playlist {{ value$$q.playlist$$q.title }}
            </template>
            <s-playlist-image
              class="w-50 h-50"
              size="200"
              :playlist="value$$q.playlist$$q"
              @image-ids="imageIds$$q = $event"
            />
          </s-image-manager>
        </template>
        <template v-else>
          <router-link :to="`/playlists/${playlistId$$q}`" class="block">
            <s-playlist-image
              class="w-50 h-50"
              size="200"
              :playlist="value$$q.playlist$$q"
              @image-ids="imageIds$$q = $event"
              @contextmenu.prevent="openMenu$$q($event)"
            />
          </router-link>
        </template>
      </div>
      <div class="flex flex-col gap-y-6 md:gap-y-4 <md:text-center">
        <div class="flex-none font-bold text-xl">
          <s-conditional-link
            :to="`/playlists/${playlistId$$q}`"
            :disabled="linkExcludes.includes(playlistId$$q)"
            @contextmenu.prevent="openMenu$$q($event)"
          >
            {{ value$$q?.playlist$$q.title }}
          </s-conditional-link>
        </div>
        <div>{{ value$$q?.playlist$$q.notes }}</div>
        <div class="flex-1 <md:hidden"></div>
        <div class="flex-none text-sm">
          <span>
            {{ t('playlist.n_tracks', value$$q.tracks$$q.length) }}
          </span>
          <span v-show="duration$$q">, {{ duration$$q }}</span>
        </div>
      </div>
    </div>
    <div class="flex-none flex flex-row items-center gap-x-8 my-8">
      <v-btn
        color="primary"
        flat
        icon
        :disabled="!value$$q?.tracks$$q.length"
        @click="play$$q(false)"
      >
        <v-icon>mdi-play</v-icon>
      </v-btn>
      <v-btn
        color="accent"
        outlined
        :disabled="!value$$q?.tracks$$q.length"
        @click="play$$q(true)"
      >
        <v-icon left>mdi-shuffle</v-icon>
        <span>
          {{ t('album.Shuffle') }}
        </span>
      </v-btn>
      <button
        class="rounded-full"
        @click="openMenu$$q($event.target as HTMLElement)"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </button>
      <v-divider />
    </div>
  </template>
  <s-track-list
    render-mode="draggable"
    show-album
    show-artist
    :tracks="value$$q?.tracks$$q"
    :link-excludes="linkExcludes"
    index-content="index"
    :set-list="value$$q?.tracks$$q"
    :playlist-id="playlistId$$q"
    visit-album
    visit-artist
    @move="onMove$$q"
  />
  <template v-if="value$$q">
    <n-dropdown
      class="select-none"
      placement="bottom-start"
      trigger="manual"
      :x="menuX$$q"
      :y="menuY$$q"
      :options="menuOptions$$q"
      :show="menuIsOpen$$q"
      :on-clickoutside="closeMenu$$q"
      @contextmenu.prevent
    />
    <s-dialog-playlist-edit
      v-model="dialog$$q"
      :playlist="value$$q.playlist$$q"
    />
  </template>
</template>
