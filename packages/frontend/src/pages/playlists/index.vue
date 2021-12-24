<script lang="ts">
import { syncDB } from '~/db/sync';
import apiInstance from '~/logic/api';
import { calcTracksTotalDuration, formatTotalDuration } from '~/logic/duration';
import { useAllPlaylists, useAllTrackMap } from '~/logic/useDB';
import { usePlaybackStore } from '~/stores/playback';
import { useThemeStore } from '~/stores/theme';
import type { ResourcePlaylist, ResourceTrack } from '$/types';

interface Item {
  readonly playlist$$q: ResourcePlaylist;
  readonly tracks$$q: readonly ResourceTrack[];
  readonly id$$q: string;
  readonly title$$q: string;
  readonly description$$q: string;
  readonly trackCount$$q: number;
  readonly duration$$q: number;
  readonly formattedDuration$$q: string;
  readonly isLast$$q: boolean;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const themeStore = useThemeStore();
    const playbackStore = usePlaybackStore();

    useHead({
      title: t('title.Playlists'),
    });

    onBeforeUnmount(() => {
      playbackStore.setDefaultSetList$$q();
    });

    const allPlaylists = useAllPlaylists();
    const allTrackMap = useAllTrackMap();

    const items = asyncComputed(async () => {
      const playlists = await allPlaylists.valueAsync.value;
      const trackMap = await allTrackMap.valueAsync.value;

      return playlists.map((playlist, index, arr): Item => {
        const tracks = playlist.trackIds.map(
          (trackId) => trackMap.get(trackId)!
        );
        const duration = calcTracksTotalDuration(tracks);
        return {
          playlist$$q: playlist,
          tracks$$q: tracks,
          id$$q: playlist.id,
          title$$q: playlist.title,
          description$$q: playlist.notes,
          trackCount$$q: tracks.length,
          duration$$q: duration,
          formattedDuration$$q: formatTotalDuration(duration),
          isLast$$q: index === arr.length - 1,
        };
      });
    });

    const createPlaylistDialogLoading = ref(false);
    const createPlaylistDialog = ref(false);
    const createPlaylistDialogTitle = ref('');
    const createPlaylistDialogDescription = ref('');

    return {
      t,
      themeStore$$q: themeStore,
      items$$q: items,
      d: createPlaylistDialog,
      i: createPlaylistDialogTitle,
      e: createPlaylistDialogDescription,
      createPlaylistDialogLoading$$q: createPlaylistDialogLoading,
      openCreatePlaylistDialog$$q: (): void => {
        createPlaylistDialogTitle.value = '';
        createPlaylistDialogDescription.value = '';
        createPlaylistDialog.value = true;
      },
      closeCreatePlaylistDialog$$q: (create: boolean): void => {
        if (!create) {
          createPlaylistDialog.value = false;
          return;
        }
        createPlaylistDialogLoading.value = true;
        apiInstance.my.playlists
          .$post({
            body: {
              title: createPlaylistDialogTitle.value,
              notes: createPlaylistDialogDescription.value,
            },
          })
          .then(() => syncDB())
          .then(() => {
            createPlaylistDialog.value = false;
          })
          .catch(() => {
            createPlaylistDialogLoading.value = false;
          });
      },
    };
  },
});
</script>

<template>
  <v-container fluid>
    <header class="mb-6">
      <div class="text-h5">
        {{ t('playlists.Playlists') }}
      </div>
    </header>

    <div class="mb-6">
      <v-btn color="primary" @click.stop="openCreatePlaylistDialog$$q()">
        Create Playlist
      </v-btn>
      <v-dialog
        v-model="d"
        class="s-v-dialog"
        :theme="themeStore$$q.dialogTheme"
      >
        <v-card>
          <v-card-title class="headline" primary-title>
            Create Playlist
          </v-card-title>
          <v-card-text>
            <div>
              <v-text-field
                v-model="i"
                label="Title"
                required
                :readonly="createPlaylistDialogLoading$$q"
              />
            </div>
            <div>
              <v-textarea
                v-model="e"
                label="Description"
                :readonly="createPlaylistDialogLoading$$q"
              />
            </div>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-spacer />
            <v-btn
              text
              :disabled="createPlaylistDialogLoading$$q"
              @click="closeCreatePlaylistDialog$$q(false)"
            >
              Cancel
            </v-btn>
            <v-btn
              color="primary"
              text
              :disabled="createPlaylistDialogLoading$$q"
              @click="closeCreatePlaylistDialog$$q(true)"
            >
              Create
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <div class="playlists">
      <template v-if="items$$q?.length">
        <v-list flat>
          <template v-for="(item, _index) in items$$q" :key="_index">
            <v-list-item :to="`/playlists/${item.id$$q}`" class="flex gap-x-4">
              <s-playlist-image
                class="flex-none w-9 h-9"
                size="36"
                :playlist="item.playlist$$q"
              />
              <v-list-item-header class="flex-1">
                <v-list-item-title>{{ item.title$$q }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ t('playlists.n_tracks', item.trackCount$$q) }},
                  {{ item.formattedDuration$$q }}
                </v-list-item-subtitle>
              </v-list-item-header>
            </v-list-item>
            <template v-if="!item.isLast$$q">
              <v-divider />
            </template>
          </template>
        </v-list>
      </template>
      <template v-else>
        <div>No playlists here</div>
      </template>
    </div>
  </v-container>
</template>
