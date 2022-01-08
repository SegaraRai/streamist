<script lang="ts">
import { useMessage } from 'naive-ui';
import type { PropType } from 'vue';
import type { ResourceArtist } from '$/types';
import { useSyncDB } from '~/db/sync';
import api from '~/logic/api';

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

    const artistId$$q = ref('');
    const newArtistId$$q = ref<string | undefined>();
    const newArtistName$$q = ref('');

    const reloadData = (newArtist: ResourceArtist): void => {
      artistId$$q.value = newArtist.id;
      newArtistId$$q.value = newArtist.id;
      newArtistName$$q.value = '';
    };

    watch(
      eagerComputed(() => props.artist),
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

    const modified$$q = eagerComputed(
      () => newArtistId$$q.value && newArtistId$$q.value !== artistId$$q.value
    );

    return {
      t,
      imageIds$$q: ref<readonly string[] | undefined>(),
      dialog$$q,
      newArtistId$$q,
      newArtistName$$q,
      modified$$q,
      apply$$q: () => {
        const artist = props.artist;
        const artistId = artistId$$q.value;
        if (artist.id !== artistId) {
          return;
        }

        if (!newArtistId$$q.value) {
          return;
        }

        api.my.artists
          ._artistId(artistId)
          .$post({
            body: {
              toArtistId: newArtistId$$q.value,
            },
          })
          .then(() => {
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
        <div class="flex-1">
          {{ t('dialogComponent.mergeArtist.title', [artist.name]) }}
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
        <div class="flex gap-x-4">
          <div>
            <s-artist-image
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
            <s-combobox-artist
              v-model="newArtistName$$q"
              v-model:artistId="newArtistId$$q"
              :label="t('dialogComponent.mergeArtist.label.Artist')"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-4">
        <v-spacer />
        <v-btn @click="dialog$$q = false">
          {{ t('dialogComponent.mergeArtist.button.Cancel') }}
        </v-btn>
        <v-btn color="warning" :disabled="!modified$$q" @click="apply$$q">
          {{ t('dialogComponent.mergeArtist.button.Merge') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </n-modal>
</template>
