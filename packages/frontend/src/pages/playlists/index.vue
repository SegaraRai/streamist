<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import {
  /*type*/
  MutablePlaylistDTO,
  MutableTagDTO,
  MutableTrackDTO,
} from '@streamist/shared/lib/dto/db.dto';
import { /*type*/ ImmutableDTO } from '@streamist/shared/lib/dto/immutable';
import { calcTracksTotalDuration, formatTotalDuration } from '@/lib/duration';
import { sortPlaylists } from '@/lib/sort';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { useStyleStore } from '@/stores/style';

interface MutableResponsePlaylistDTO extends MutablePlaylistDTO {
  tags: MutableTagDTO[];
  tracks: MutableTrackDTO[];
}

//

type ResponsePlaylistDTO = ImmutableDTO<MutableResponsePlaylistDTO>;

//

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
    const styleStore = useStyleStore();

    const playlists = ref([] as ResponsePlaylistDTO[]);

    const playlistRepository = RepositoryFactory.get('playlist');

    const fetchPlaylists = async () => {
      const response = await playlistRepository.fetchPlaylists$$q({}, [
        'tags',
        'tracks',
      ]);
      playlists.value = sortPlaylists(
        response.data as MutableResponsePlaylistDTO[],
        true
      );
    };
    fetchPlaylists();

    const items = computed(() => {
      return playlists.value.map(
        (playlist, index): Item => {
          const duration = calcTracksTotalDuration(playlist.tracks);
          return {
            id$$q: playlist.id,
            title$$q: playlist.title,
            description$$q: playlist.description,
            trackCount$$q: playlist.tracks.length,
            duration$$q: duration,
            formattedDuration$$q: formatTotalDuration(duration),
            isLast$$q: index === playlists.value.length - 1,
          };
        }
      );
    });

    const createPlaylistDialogLoading = ref(false);
    const createPlaylistDialog = ref(false);
    const createPlaylistDialogTitle = ref('');
    const createPlaylistDialogDescription = ref('');

    return {
      styleStore$$q: styleStore,
      items$$q: items,
      d: createPlaylistDialog,
      t: createPlaylistDialogTitle,
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
        playlistRepository
          .createPlaylist$$q({
            title: createPlaylistDialogTitle.value,
            description: createPlaylistDialogDescription.value,
            trackIds: [],
          })
          .then(() => fetchPlaylists())
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
        {{ $t('playlists/Playlists') }}
      </div>
    </header>

    <div class="mb-6">
      <v-btn color="primary" @click.stop="openCreatePlaylistDialog$$q()">
        Create Playlist
      </v-btn>
      <v-dialog
        v-model="d"
        max-width="600px"
        :dark="styleStore$$q.dialogDark$$q"
      >
        <v-card>
          <v-card-title class="headline" primary-title>
            Create Playlist
          </v-card-title>
          <v-card-text>
            <div>
              <v-text-field
                v-model="t"
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
          <v-list-item-group>
            <template v-for="(item, index) in items$$q">
              <v-list-item
                :key="index"
                class="hover-container"
                :to="`/playlists/${item.id$$q}`"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ item.title$$q }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $tc('playlists/{n} tracks', item.trackCount$$q) }},
                    {{ item.formattedDuration$$q }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <template v-if="!item.isLast$$q">
                <v-divider :key="'d-' + index"></v-divider>
              </template>
            </template>
          </v-list-item-group>
        </v-list>
      </template>
      <template v-else>
        <div>No playlists here</div>
      </template>
    </div>
  </v-container>
</template>
