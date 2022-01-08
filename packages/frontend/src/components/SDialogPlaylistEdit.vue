<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { useDisplay } from 'vuetify';
import type { ResourcePlaylist } from '$/types';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';

export default defineComponent({
  props: {
    playlist: {
      type: Object as PropType<ResourcePlaylist>,
      required: true,
    },
    modelValue: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();
    const display = useDisplay();
    const message = useMessage();
    const syncDB = useSyncDB();

    const dialog$$q = useVModel(props, 'modelValue', emit);

    const playlistId$$q = ref('');
    const itemTitle$$q = ref('');
    const itemNotes$$q = ref('');

    const reloadData = (newPlaylist: ResourcePlaylist): void => {
      playlistId$$q.value = newPlaylist.id;
      itemTitle$$q.value = newPlaylist.title;
      itemNotes$$q.value = newPlaylist.notes;
    };

    watch(
      eagerComputed(() => props.playlist),
      reloadData,
      {
        immediate: true,
      }
    );

    watch(dialog$$q, (newDialog, oldDialog) => {
      if (!newDialog && oldDialog) {
        reloadData(props.playlist);
      }
    });

    const modified$$q = eagerComputed(
      () =>
        (itemTitle$$q.value && itemTitle$$q.value !== props.playlist.title) ||
        itemNotes$$q.value !== props.playlist.notes
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      fullscreen$$q: eagerComputed(() => display.smAndDown.value),
      itemTitle$$q,
      itemNotes$$q,
      modified$$q,
      apply$$q: () => {
        const playlist = props.playlist;
        const playlistId = playlistId$$q.value;
        if (playlist.id !== playlistId) {
          return;
        }
        api.my.playlists
          ._playlistId(playlistId)
          .$patch({
            body: {
              title:
                itemTitle$$q.value && itemTitle$$q.value !== playlist.title
                  ? itemTitle$$q.value
                  : undefined,
              notes:
                playlist.notes !== itemNotes$$q.value
                  ? itemNotes$$q.value
                  : undefined,
            },
          })
          .then(() => {
            dialog$$q.value = false;
            message.success(
              t('message.ModifiedPlaylist', [itemTitle$$q.value])
            );
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyPlaylist', [
                playlist.title,
                String(error),
              ])
            );
          });
      },
    };
  },
});
</script>

<template>
  <v-dialog v-model="dialog$$q" class="select-none" :fullscreen="fullscreen$$q">
    <v-card class="w-full md:min-w-2xl">
      <v-card-title class="flex">
        <div class="flex-1">
          {{ t('dialogComponent.editPlaylist.title', [playlist.title]) }}
        </div>
        <div class="flex-none">
          <v-btn
            flat
            icon
            size="x-small"
            class="text-red-500"
            @click="dialog$$q = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text class="opacity-100">
        <div class="flex gap-x-6">
          <div>
            <s-image-manager
              attach-to-type="playlist"
              :attach-to-id="playlist.id"
              :attach-to-title="playlist.title"
              :image-ids="imageIds$$q"
              disable-dialog
              @contextmenu.prevent
            >
              <s-playlist-image
                class="w-40 h-40"
                size="160"
                :playlist="playlist"
                @image-ids="imageIds$$q = $event"
              />
            </s-image-manager>
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <v-text-field
              v-model="itemTitle$$q"
              hide-details
              class="s-v-input-hide-details"
              :label="t('dialogComponent.editPlaylist.label.Title')"
              required
            />
            <v-textarea
              v-model="itemNotes$$q"
              hide-details
              class="s-v-input-hide-details"
              :label="t('dialogComponent.editPlaylist.label.Description')"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-6">
        <v-spacer />
        <v-btn @click="dialog$$q = false">
          {{ t('dialogComponent.editPlaylist.button.Cancel') }}
        </v-btn>
        <v-btn color="primary" :disabled="!modified$$q" @click="apply$$q">
          {{ t('dialogComponent.editPlaylist.button.OK') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
