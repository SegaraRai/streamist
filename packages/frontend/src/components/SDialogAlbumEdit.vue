<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import { compareCoArtist } from '$/shared/sort';
import type { ResourceAlbum } from '$/types';
import { useLiveQuery, useTranslatedTimeAgo } from '~/composables';
import { db, useSyncDB } from '~/db';
import { api } from '~/logic/api';
import {
  CoArtist,
  createCoArtistUpdate,
  isSameCoArtists,
} from '~/logic/coArtist';
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

    const requestInProgress$$q = ref(false);

    const { valueAsync: allAlbumCoArtistsPromise } = useLiveQuery(() =>
      db.albumCoArtists.toArray()
    );

    const albumId$$q = ref('');
    const artistId$$q = ref<string | undefined>();
    const artistName$$q = ref('');
    const itemTitle$$q = ref('');
    const itemTitleSort$$q = ref('');
    const itemDescription$$q = ref('');
    const itemOrgCoArtists$$q = ref<
      readonly Readonly<CoArtist>[] | undefined
    >();
    const itemCoArtists$$q = ref<CoArtist[] | undefined>();

    const reloadData = (newAlbum: ResourceAlbum): void => {
      requestInProgress$$q.value = false;
      albumId$$q.value = newAlbum.id;
      artistId$$q.value = newAlbum.artistId;
      artistName$$q.value = '';
      itemTitle$$q.value = newAlbum.title;
      itemTitleSort$$q.value = newAlbum.titleSort || '';
      itemDescription$$q.value = newAlbum.description || '';
      itemOrgCoArtists$$q.value = undefined;
      itemCoArtists$$q.value = undefined;
      allAlbumCoArtistsPromise.value.then((allAlbumCoArtists) => {
        if (albumId$$q.value !== newAlbum.id) {
          return;
        }
        const coArtists: readonly Readonly<CoArtist>[] = allAlbumCoArtists
          .filter((item) => item.albumId === newAlbum.id)
          .sort(compareCoArtist)
          .map((item) => [item.role, item.artistId, '']);
        itemOrgCoArtists$$q.value = coArtists;
        itemCoArtists$$q.value = JSON.parse(JSON.stringify(coArtists));
      });
    };

    watch(
      computedEager(() => props.album),
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

    const isArtistEmpty$$q = computedEager(
      () => !artistId$$q.value && !artistName$$q.value
    );

    const modified$$q = computedEager(
      () =>
        (itemTitle$$q.value && itemTitle$$q.value !== props.album.title) ||
        (itemTitleSort$$q.value || null) !== props.album.titleSort ||
        itemDescription$$q.value !== props.album.description ||
        (!isArtistEmpty$$q.value &&
          artistId$$q.value !== props.album.artistId) ||
        (itemOrgCoArtists$$q.value &&
          itemCoArtists$$q.value &&
          !isSameCoArtists(itemOrgCoArtists$$q.value, itemCoArtists$$q.value))
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      requestInProgress$$q,
      isArtistEmpty$$q,
      artistId$$q,
      artistName$$q,
      itemTitle$$q,
      itemTitleSort$$q,
      itemDescription$$q,
      itemCoArtists$$q,
      modified$$q,
      strCreatedAt$$q: useTranslatedTimeAgo(
        computedEager(() => props.album.createdAt)
      ),
      strUpdatedAt$$q: useTranslatedTimeAgo(
        computedEager(() => props.album.updatedAt)
      ),
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        const album = props.album;
        const albumId = albumId$$q.value;
        if (album.id !== albumId) {
          return;
        }

        requestInProgress$$q.value = true;

        api.my.albums
          ._albumId(albumId)
          .$patch({
            body: {
              title: convertReqStr(itemTitle$$q.value, album.title),
              titleSort: convertOptStr(itemTitleSort$$q.value, album.titleSort),
              description: convertOptStr(
                itemDescription$$q.value,
                album.description
              ),
              artistId: convertOptId(artistId$$q.value, album.artistId),
              artistName: artistId$$q.value
                ? undefined
                : artistName$$q.value.trim(),
              coArtists:
                itemOrgCoArtists$$q.value && itemCoArtists$$q.value
                  ? createCoArtistUpdate(
                      itemOrgCoArtists$$q.value,
                      itemCoArtists$$q.value
                    )
                  : undefined,
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
          {{ t('dialogComponent.editAlbum.title', [album.title]) }}
        </div>
        <div class="flex-none">
          <VBtn
            flat
            icon
            size="x-small"
            class="text-st-error"
            @click="dialog$$q = false"
          >
            <i-mdi-close />
          </VBtn>
        </div>
      </VCardTitle>
      <VCardText class="opacity-100">
        <div class="flex <sm:flex-col gap-x-4 gap-y-6">
          <div class="<sm:w-full text-center leading-none">
            <SImageManager
              attach-to-type="album"
              :attach-to-id="album.id"
              :attach-to-title="album.title"
              :image-ids="imageIds$$q"
              disable-dialog
              @contextmenu.prevent
            >
              <SAlbumImage
                class="w-40 h-40"
                size="160"
                :album="album.id"
                @image-ids="imageIds$$q = $event"
              />
            </SImageManager>
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <div class="flex gap-x-6">
              <VTextField
                v-model="itemTitle$$q"
                hide-details
                class="flex-1"
                :label="t('dialogComponent.editAlbum.label.Title')"
                required
              />
              <VTextField
                v-model="itemTitleSort$$q"
                hide-details
                class="flex-1"
                :label="t('dialogComponent.editAlbum.label.TitleSort')"
              />
            </div>
            <SComboboxArtist
              v-model="artistName$$q"
              v-model:artistId="artistId$$q"
              :label="t('dialogComponent.editAlbum.label.Artist')"
              create
            />
            <NCollapse>
              <NCollapseItem :title="t('dialogComponent.editAlbum.creators')">
                <template v-if="itemCoArtists$$q">
                  <NScrollbar class="s-n-scrollbar-p max-h-64">
                    <SCoArtistEdit v-model="itemCoArtists$$q" />
                  </NScrollbar>
                </template>
              </NCollapseItem>
            </NCollapse>
            <VTextarea
              v-model="itemDescription$$q"
              hide-details
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
      </VCardText>
      <VCardActions class="gap-x-4 pb-4 px-4">
        <VSpacer />
        <VBtn @click="dialog$$q = false">
          {{ t('dialogComponent.editAlbum.button.Cancel') }}
        </VBtn>
        <VBtn
          class="relative"
          color="primary"
          :disabled="requestInProgress$$q || isArtistEmpty$$q || !modified$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('dialogComponent.editAlbum.button.OK') }}
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
