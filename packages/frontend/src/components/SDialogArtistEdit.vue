<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourceArtist } from '$/types';
import { useTranslatedTimeAgo } from '~/composables';
import { useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { convertOptStr, convertReqStr } from '~/logic/editUtils';

export default defineComponent({
  props: {
    artist: {
      type: Object as PropType<ResourceArtist>,
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

    const artistId$$q = ref('');
    const itemName$$q = ref('');
    const itemNameSort$$q = ref('');
    const itemDescription$$q = ref('');

    const reloadData = (newArtist: ResourceArtist): void => {
      requestInProgress$$q.value = false;
      artistId$$q.value = newArtist.id;
      itemName$$q.value = newArtist.name;
      itemNameSort$$q.value = newArtist.nameSort || '';
      itemDescription$$q.value = newArtist.description;
    };

    watch(
      computedEager(() => props.artist),
      reloadData,
      {
        immediate: true,
      }
    );

    watch(dialog$$q, (newDialog, oldDialog) => {
      if (!newDialog && oldDialog) {
        reloadData(props.artist);
      }
    });

    const modified$$q = computedEager(
      () =>
        (itemName$$q.value && itemName$$q.value !== props.artist.name) ||
        (itemNameSort$$q.value || null) !== props.artist.nameSort ||
        itemDescription$$q.value !== props.artist.description
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      requestInProgress$$q,
      artistId$$q,
      itemName$$q,
      itemNameSort$$q,
      itemDescription$$q,
      modified$$q,
      strCreatedAt$$q: useTranslatedTimeAgo(
        computedEager(() => props.artist.createdAt)
      ),
      strUpdatedAt$$q: useTranslatedTimeAgo(
        computedEager(() => props.artist.updatedAt)
      ),
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        const artist = props.artist;
        const artistId = artistId$$q.value;
        if (artist.id !== artistId) {
          return;
        }

        requestInProgress$$q.value = true;

        api.my.artists
          ._artistId(artistId)
          .$patch({
            body: {
              name: convertReqStr(itemName$$q.value, artist.name),
              nameSort: convertOptStr(itemNameSort$$q.value, artist.nameSort),
              description: convertOptStr(
                itemDescription$$q.value,
                artist.description
              ),
            },
          })
          .then(() => {
            dialog$$q.value = false;
            message.success(t('message.ModifiedArtist', [itemName$$q.value]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToModifyArtist', [artist.name, String(error)])
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
          {{ t('dialogComponent.editArtist.title', [artist.name]) }}
        </div>
        <div class="flex-none">
          <VBtn
            flat
            icon
            size="x-small"
            class="text-st-error"
            @click="dialog$$q = false"
          >
            <VIcon icon="mdi-close" />
          </VBtn>
        </div>
      </VCardTitle>
      <VCardText class="opacity-100">
        <div class="flex <sm:flex-col gap-x-4 gap-y-6">
          <div class="<sm:w-full text-center leading-none">
            <SImageManager
              attach-to-type="artist"
              :attach-to-id="artist.id"
              :attach-to-title="artist.name"
              :image-ids="imageIds$$q"
              disable-dialog
              @contextmenu.prevent
            >
              <SArtistImage
                class="w-40 h-40"
                size="160"
                :artist="artist.id"
                @image-ids="imageIds$$q = $event"
              />
            </SImageManager>
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <div class="flex gap-x-6">
              <VTextField
                v-model="itemName$$q"
                hide-details
                class="flex-1"
                :label="t('dialogComponent.editArtist.label.Name')"
                required
              />
              <VTextField
                v-model="itemNameSort$$q"
                hide-details
                class="flex-1"
                :label="t('dialogComponent.editArtist.label.NameSort')"
              />
            </div>
            <VTextarea
              v-model="itemDescription$$q"
              hide-details
              :label="t('dialogComponent.editArtist.label.Description')"
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
          {{ t('dialogComponent.editArtist.button.Cancel') }}
        </VBtn>
        <VBtn
          class="relative"
          color="primary"
          :disabled="requestInProgress$$q || !modified$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('dialogComponent.editArtist.button.OK') }}
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
