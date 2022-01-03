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
    const title$$q = ref('');
    const notes$$q = ref('');

    watch(
      eagerComputed(() => props.playlist),
      (newPlaylist) => {
        playlistId$$q.value = newPlaylist.id;
        title$$q.value = newPlaylist.title;
        notes$$q.value = newPlaylist.notes;
      },
      {
        immediate: true,
      }
    );

    const modified$$q = eagerComputed(
      () =>
        title$$q.value !== props.playlist.title ||
        notes$$q.value !== props.playlist.notes
    );

    return {
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      fullscreen$$q: eagerComputed(() => display.smAndDown.value),
      title$$q,
      notes$$q,
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
                playlist.title !== title$$q.value ? title$$q.value : undefined,
              notes:
                playlist.notes !== notes$$q.value ? notes$$q.value : undefined,
            },
          })
          .then(() => {
            dialog$$q.value = false;
            message.success(t('message.ModifiedPlaylist', [title$$q.value]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyPlaylist', [
                title$$q.value,
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
        <div class="flex-1">Edit {{ playlist.title }}</div>
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
        <div class="flex gap-x-4">
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
          <div class="flex-1">
            <v-text-field v-model="title$$q" label="Title" />
            <v-textarea v-model="notes$$q" label="Description" />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-6">
        <v-spacer />
        <v-btn @click="dialog$$q = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!modified$$q" @click="apply$$q">
          OK
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
