<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourceArtist } from '$/types';
import { useSyncDB } from '~/db';
import { api } from '~/logic/api';
import { setRedirect } from '~/stores/redirect';

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
    const newArtistId$$q = ref<string | undefined>();
    const newArtistName$$q = ref('');

    const reloadData = (newArtist: ResourceArtist): void => {
      requestInProgress$$q.value = false;
      artistId$$q.value = newArtist.id;
      newArtistId$$q.value = newArtist.id;
      newArtistName$$q.value = '';
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
      () => newArtistId$$q.value && newArtistId$$q.value !== artistId$$q.value
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      requestInProgress$$q,
      newArtistId$$q,
      newArtistName$$q,
      modified$$q,
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        const artist = props.artist;
        const artistId = artistId$$q.value;
        if (artist.id !== artistId) {
          return;
        }

        const newArtistId = newArtistId$$q.value;
        if (!newArtistId) {
          return;
        }

        requestInProgress$$q.value = true;

        api.my.artists
          ._artistId(artistId)
          .$post({
            body: {
              toArtistId: newArtistId,
            },
          })
          .then(() => {
            setRedirect(`/artists/${artistId}`, `/artists/${newArtistId}`);
            dialog$$q.value = false;
            message.success(
              t('message.MergedArtist', [artist.name, newArtistName$$q.value])
            );
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToMergeArtist', [
                artist.name,
                newArtistName$$q.value,
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
          {{ t('dialogComponent.mergeArtist.title', [artist.name]) }}
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
        <div class="flex gap-x-4">
          <div>
            <SArtistImage
              class="w-40 h-40"
              size="160"
              :artist="artist"
              @image-ids="imageIds$$q = $event"
            />
          </div>
          <div class="flex-1 flex flex-col gap-y-6">
            <div>
              Merging artist <strong>{{ artist.name }}</strong> to
            </div>
            <SComboboxArtist
              v-model="newArtistName$$q"
              v-model:artistId="newArtistId$$q"
              :label="t('dialogComponent.mergeArtist.label.Artist')"
            />
          </div>
        </div>
      </VCardText>
      <VCardActions class="gap-x-4 pb-4 px-4">
        <VSpacer />
        <VBtn @click="dialog$$q = false">
          {{ t('dialogComponent.mergeArtist.button.Cancel') }}
        </VBtn>
        <VBtn
          class="relative"
          color="warning"
          :disabled="requestInProgress$$q || !modified$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('dialogComponent.mergeArtist.button.Merge') }}
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
