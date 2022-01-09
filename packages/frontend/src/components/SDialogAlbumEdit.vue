<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourceAlbum } from '$/types';
import { useTranslatedTimeAgo } from '~/composables/timeAgo';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';
import { convertOptId, convertOptStr, convertReqStr } from '~/logic/editUtils';

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

    const albumId$$q = ref('');
    const artistId$$q = ref<string | undefined>();
    const artistName$$q = ref('');
    const itemTitle$$q = ref('');
    const itemTitleSort$$q = ref('');
    const itemDescription$$q = ref('');

    const reloadData = (newAlbum: ResourceAlbum): void => {
      albumId$$q.value = newAlbum.id;
      artistId$$q.value = newAlbum.artistId;
      artistName$$q.value = '';
      itemTitle$$q.value = newAlbum.title;
      itemTitleSort$$q.value = newAlbum.titleSort || '';
      itemDescription$$q.value = newAlbum.notes || '';
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

    const isArtistEmpty$$q = eagerComputed(
      () => !artistId$$q.value && !artistName$$q.value
    );

    const modified$$q = eagerComputed(
      () =>
        (itemTitle$$q.value && itemTitle$$q.value !== props.album.title) ||
        (itemTitleSort$$q.value || null) !== props.album.titleSort ||
        itemDescription$$q.value !== props.album.notes ||
        (!isArtistEmpty$$q.value && artistId$$q.value !== props.album.artistId)
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      isArtistEmpty$$q,
      artistId$$q,
      artistName$$q,
      itemTitle$$q,
      itemTitleSort$$q,
      itemDescription$$q,
      modified$$q,
      strCreatedAt$$q: useTranslatedTimeAgo(
        eagerComputed(() => props.album.createdAt)
      ),
      strUpdatedAt$$q: useTranslatedTimeAgo(
        eagerComputed(() => props.album.updatedAt)
      ),
      apply$$q: () => {
        const album = props.album;
        const albumId = albumId$$q.value;
        if (album.id !== albumId) {
          return;
        }

        api.my.albums
          ._albumId(albumId)
          .$patch({
            body: {
              title: convertReqStr(itemTitle$$q.value, album.title),
              titleSort: convertOptStr(itemTitleSort$$q.value, album.titleSort),
              notes: convertOptStr(itemDescription$$q.value, album.notes),
              artistId: convertOptId(artistId$$q.value, album.artistId),
              artistName: artistId$$q.value
                ? undefined
                : artistName$$q.value.trim(),
            },
          })
          .then(() => {
            // TODO: アーティストIDが更新されたらリダイレクトを登録
            dialog$$q.value = false;
            message.success(t('message.ModifiedAlbum', [itemTitle$$q.value]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyAlbum', [album.title, String(error)])
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
          {{ t('dialogComponent.editAlbum.title', [album.title]) }}
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
            <s-image-manager
              attach-to-type="album"
              :attach-to-id="album.id"
              :attach-to-title="album.title"
              :image-ids="imageIds$$q"
              disable-dialog
              @contextmenu.prevent
            >
              <s-album-image
                class="w-40 h-40"
                size="160"
                :album="album.id"
                @image-ids="imageIds$$q = $event"
              />
            </s-image-manager>
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <div class="flex gap-x-6">
              <v-text-field
                v-model="itemTitle$$q"
                hide-details
                class="flex-1 s-v-input-hide-details"
                :label="t('dialogComponent.editAlbum.label.Title')"
                required
              />
              <v-text-field
                v-model="itemTitleSort$$q"
                hide-details
                class="flex-1 s-v-input-hide-details"
                :label="t('dialogComponent.editAlbum.label.TitleSort')"
              />
            </div>
            <s-combobox-artist
              v-model="artistName$$q"
              v-model:artistId="artistId$$q"
              :label="t('dialogComponent.editAlbum.label.Artist')"
            />
            <v-textarea
              v-model="itemDescription$$q"
              hide-details
              class="s-v-input-hide-details"
              :label="t('dialogComponent.editAlbum.label.Description')"
            />
            <footer class="flex m-0 gap-x-4 justify-end">
              <dl class="flex gap-x-4">
                <dt>created</dt>
                <dd>{{ strCreatedAt$$q }}</dd>
              </dl>
              <div class="border-l"></div>
              <dl class="flex gap-x-4">
                <dt>last updated</dt>
                <dd>{{ strUpdatedAt$$q }}</dd>
              </dl>
            </footer>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-4">
        <v-spacer />
        <v-btn @click="dialog$$q = false">
          {{ t('dialogComponent.editAlbum.button.Cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="isArtistEmpty$$q || !modified$$q"
          @click="apply$$q"
        >
          {{ t('dialogComponent.editAlbum.button.OK') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </n-modal>
</template>
