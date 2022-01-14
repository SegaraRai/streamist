<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourceAlbum } from '$/types';
import { useSyncDB } from '~/db';
import api from '~/logic/api';
import { setRedirect } from '~/stores/redirect';

export default defineComponent({
  props: {
    album: {
      type: Object as PropType<ResourceAlbum>,
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

    const requestInProgress$$q = ref(false);

    const albumId$$q = ref('');
    const newAlbumId$$q = ref<string | undefined>();
    const newAlbumTitle$$q = ref<string>('');

    const reloadData = (newAlbum: ResourceAlbum): void => {
      requestInProgress$$q.value = false;
      albumId$$q.value = newAlbum.id;
      newAlbumId$$q.value = newAlbum.id;
      newAlbumTitle$$q.value = '';
    };

    watch(
      eagerComputed(() => props.album),
      reloadData,
      {
        immediate: true,
      }
    );

    watch(dialog$$q, (newDialog, oldDialog) => {
      if (!newDialog && oldDialog) {
        reloadData(props.album);
      }
    });

    const modified$$q = eagerComputed(
      () => newAlbumId$$q.value && newAlbumId$$q.value !== albumId$$q.value
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      requestInProgress$$q,
      newAlbumId$$q,
      newAlbumTitle$$q,
      modified$$q,
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        const album = props.album;
        const albumId = albumId$$q.value;
        if (album.id !== albumId) {
          return;
        }

        const newAlbumId = newAlbumId$$q.value;
        if (!newAlbumId) {
          return;
        }

        requestInProgress$$q.value = true;

        api.my.albums
          ._albumId(albumId)
          .$post({
            body: {
              toAlbumId: newAlbumId,
            },
          })
          .then(() => {
            setRedirect(`/albums/${albumId}`, `/albums/${newAlbumId}`);
            dialog$$q.value = false;
            message.success(
              t('message.MergedAlbum', [album.title, newAlbumTitle$$q.value])
            );
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToMergeAlbum', [
                album.title,
                newAlbumTitle$$q.value,
                String(error),
              ])
            );
          })
          .finally(() => {
            requestInProgress$$q.value = false;
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
          {{ t('dialogComponent.mergeAlbum.title', [album.title]) }}
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
        <div class="flex gap-x-4">
          <div>
            <s-album-image
              class="w-40 h-40"
              size="160"
              :album="album"
              @image-ids="imageIds$$q = $event"
            />
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <div>
              Merging album <strong>{{ album.title }}</strong> to
            </div>
            <s-combobox-album
              v-model="newAlbumTitle$$q"
              v-model:albumId="newAlbumId$$q"
              :label="t('dialogComponent.mergeAlbum.label.Album')"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-4">
        <v-spacer />
        <v-btn @click="dialog$$q = false">
          {{ t('dialogComponent.mergeAlbum.button.Cancel') }}
        </v-btn>
        <v-btn
          class="relative"
          color="warning"
          :disabled="requestInProgress$$q || !modified$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('dialogComponent.mergeAlbum.button.Merge') }}
          </span>
          <template v-if="requestInProgress$$q">
            <v-progress-circular
              class="absolute left-0 top-0 right-0 bottom-0 m-auto"
              indeterminate
              size="20"
            />
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </n-modal>
</template>
