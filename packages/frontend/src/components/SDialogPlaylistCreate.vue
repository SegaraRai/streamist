<script lang="ts">
import { useMessage } from 'naive-ui';
import { useSyncDB } from '~/db';
import { api } from '~/logic/api';

export default defineComponent({
  props: {
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

    const itemTitle$$q = ref('');
    const itemNotes$$q = ref('');

    const clearData = (): void => {
      requestInProgress$$q.value = false;
      itemTitle$$q.value = '';
      itemNotes$$q.value = '';
    };

    watch(dialog$$q, (newDialog, oldDialog) => {
      if (!newDialog && oldDialog) {
        clearData();
      }
    });

    const valid$$q = eagerComputed(() => !!itemTitle$$q.value.trim());

    return {
      t,
      dialog$$q,
      requestInProgress$$q,
      itemTitle$$q,
      itemNotes$$q,
      valid$$q,
      apply$$q: () => {
        if (requestInProgress$$q.value) {
          return;
        }

        requestInProgress$$q.value = true;

        api.my.playlists
          .$post({
            body: {
              title: itemTitle$$q.value,
              description: itemNotes$$q.value,
            },
          })
          .then(() => {
            dialog$$q.value = false;
            message.success(t('message.CreatedPlaylist', [itemTitle$$q.value]));
            syncDB();
          })
          .catch((error) => {
            message.error(
              t('message.FailedToCreatePlaylist', [
                itemTitle$$q.value,
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
        <div class="s-dialog-title">
          {{ t('dialogComponent.createPlaylist.title') }}
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
        <div class="flex gap-x-6">
          <div class="flex-1 flex flex-col gap-y-6">
            <v-text-field
              v-model="itemTitle$$q"
              hide-details
              class="s-v-input-hide-details"
              :label="t('dialogComponent.createPlaylist.label.Title')"
              required
            />
            <v-textarea
              v-model="itemNotes$$q"
              hide-details
              class="s-v-input-hide-details"
              :label="t('dialogComponent.createPlaylist.label.Description')"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="gap-x-4 pb-4 px-6">
        <v-spacer />
        <v-btn @click="dialog$$q = false">
          {{ t('dialogComponent.createPlaylist.button.Cancel') }}
        </v-btn>
        <v-btn
          class="relative"
          color="primary"
          :disabled="requestInProgress$$q || !valid$$q"
          @click="apply$$q"
        >
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('dialogComponent.createPlaylist.button.Create') }}
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
