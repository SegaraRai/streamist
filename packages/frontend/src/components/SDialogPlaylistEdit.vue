<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourcePlaylist } from '$/types';
import { useSyncDB } from '~/db';
import { api } from '~/logic/api';
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

    const requestInProgress$$q = ref(false);

    const playlistId$$q = ref('');
    const itemTitle$$q = ref('');
    const itemDescription$$q = ref('');

    const reloadData = (newPlaylist: ResourcePlaylist): void => {
      requestInProgress$$q.value = false;
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
      requestInProgress$$q,
      itemTitle$$q,
      itemDescription$$q,
      modified$$q,
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        const playlist = props.playlist;
        const playlistId = playlistId$$q.value;
        if (playlist.id !== playlistId) {
          return;
        }

        requestInProgress$$q.value = true;

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
  <NModal
    v-model:show="dialog$$q"
    transform-origin="center"
    class="select-none max-w-xl"
  >
    <VCard class="w-full md:min-w-2xl">
      <VCardTitle class="flex">
        <div class="s-dialog-title">
          {{ t('dialogComponent.editPlaylist.title', [playlist.title]) }}
        </div>
        <div class="flex-none">
          <VBtn
            flat
            icon
            size="x-small"
            class="text-st-error"
            @click="dialog$$q = false"
          >
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </div>
      </VCardTitle>
      <VCardText class="opacity-100">
        <div class="flex <sm:flex-col gap-x-4 gap-y-6">
          <div class="<sm:w-full text-center leading-none">
            <SImageManager
              attach-to-type="playlist"
              :attach-to-id="playlist.id"
              :attach-to-title="playlist.title"
              :image-ids="imageIds$$q"
              disable-dialog
              @contextmenu.prevent
            >
              <SPlaylistImage
                class="w-40 h-40"
                size="160"
                :playlist="playlist.id"
                @image-ids="imageIds$$q = $event"
              />
            </SImageManager>
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <VTextField
              v-model="itemTitle$$q"
              hide-details
              :label="t('dialogComponent.editPlaylist.label.Title')"
              required
            />
            <VTextarea
              v-model="itemDescription$$q"
              hide-details
              :label="t('dialogComponent.editPlaylist.label.Description')"
            />
          </div>
        </div>
      </VCardText>
      <VCardActions class="gap-x-4 pb-4 px-6">
        <VSpacer />
        <VBtn @click="dialog$$q = false">
          {{ t('dialogComponent.editPlaylist.button.Cancel') }}
        </VBtn>
        <VBtn
          class="relative"
          color="primary"
          :disabled="requestInProgress$$q || !modified$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('dialogComponent.editPlaylist.button.OK') }}
          </span>
          <template v-if="requestInProgress$$q">
            <VProgressCircular
              class="absolute left-0 top-0 right-0 bottom-0 m-auto"
              indeterminate
              size="20"
            />
          </template>
        </VBtn>
      </VCardActions>
    </VCard>
  </NModal>
</template>
