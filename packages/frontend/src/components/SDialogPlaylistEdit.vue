<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourcePlaylist } from '$/types';
import { useSyncDB } from '~/db';
import api from '~/logic/api';
import { convertOptStr, convertReqStr } from '~/logic/editUtils';

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
    const message = useMessage();
    const syncDB = useSyncDB();

    const dialog$$q = useVModel(props, 'modelValue', emit);

    const playlistId$$q = ref('');
    const itemTitle$$q = ref('');
    const itemDescription$$q = ref('');

    const reloadData = (newPlaylist: ResourcePlaylist): void => {
      playlistId$$q.value = newPlaylist.id;
      itemTitle$$q.value = newPlaylist.title;
      itemDescription$$q.value = newPlaylist.description;
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
        itemDescription$$q.value !== props.playlist.description
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      itemTitle$$q,
      itemDescription$$q,
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
              title: convertReqStr(itemTitle$$q.value, playlist.title),
              description: convertOptStr(
                itemDescription$$q.value,
                playlist.description
              ),
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
  <n-modal
    v-model:show="dialog$$q"
    transform-origin="center"
    class="select-none max-w-xl"
  >
    <v-card class="w-full md:min-w-2xl">
      <v-card-title class="flex">
        <div class="flex-1 line-clamp-2 overflow-hidden">
          {{ t('dialogComponent.editPlaylist.title', [playlist.title]) }}
        </div>
        <div class="flex-none">
          <v-btn
            flat
            icon
            size="x-small"
            class="text-st-error"
            @click="dialog$$q = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text class="opacity-100">
        <div class="flex <sm:flex-col gap-x-4 gap-y-6">
          <div class="<sm:w-full text-center leading-none">
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
                :playlist="playlist.id"
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
              v-model="itemDescription$$q"
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
  </n-modal>
</template>
