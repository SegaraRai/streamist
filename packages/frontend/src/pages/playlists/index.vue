<script lang="ts">
import { calcTracksTotalDuration, formatTotalDuration } from '@/logic/duration';
import { useThemeStore } from '@/stores/theme';
import { syncDB } from '~/db/sync';
import apiInstance from '~/logic/api';
import { fetchPlaylistsForPlayback } from '~/resources/playlist';
import { PlaylistForPlayback } from '~/types/playback';

interface Item {
  id$$q: string;
  title$$q: string;
  description$$q: string;
  trackCount$$q: number;
  duration$$q: number;
  formattedDuration$$q: string;
  isLast$$q: boolean;
}

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const themeStore = useThemeStore();

    const playlists = ref<PlaylistForPlayback[]>([]);

    const refreshPlaylists = async () => {
      playlists.value = await fetchPlaylistsForPlayback();
    };
    refreshPlaylists();

    const items = computed(() => {
      return playlists.value.map((playlist, index): Item => {
        const duration = calcTracksTotalDuration(playlist.tracks);
        return {
          id$$q: playlist.id,
          title$$q: playlist.title,
          description$$q: playlist.notes,
          trackCount$$q: playlist.tracks.length,
          duration$$q: duration,
          formattedDuration$$q: formatTotalDuration(duration),
          isLast$$q: index === playlists.value.length - 1,
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
          .then(() => refreshPlaylists())
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
  <v-container fluid class="pt-3 px-8">
    <header class="mb-6">
      <div class="display-1 font-weight-medium">
        {{ t('playlists.Playlists') }}
      </div>
    </header>

    <div class="mb-6">
      <v-btn color="primary" @click.stop="openCreatePlaylistDialog$$q()">
        Create Playlist
      </v-btn>
      <v-dialog
        v-model="d"
        max-width="600px"
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
              ></v-text-field>
            </div>
            <div>
              <v-textarea
                v-model="e"
                label="Description"
                :readonly="createPlaylistDialogLoading$$q"
              ></v-textarea>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
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
      <template v-if="items$$q.length">
        <v-list flat>
          <template v-for="(item, index) in items$$q" :key="index">
            <v-list-item
              class="hover-container"
              :to="`/playlists/${item.id$$q}`"
            >
              <v-list-item-header>
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
