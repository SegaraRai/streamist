<script lang="ts">
import { useMessage } from 'naive-ui';
import { useRegisterSW } from 'virtual:pwa-register/vue';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();
    const message = useMessage();

    const close = (): void => {
      needRefresh.value = false;
    };

    watch(offlineReady, (newValue): void => {
      if (newValue) {
        message.info(t('reloadPrompt.message.offlineReady'));
        offlineReady.value = false;
      }
    });

    return {
      t,
      needRefresh$$q: needRefresh,
      updateServiceWorker$$q: updateServiceWorker,
      close$$q: close,
    };
  },
});
</script>

<template>
  <template v-if="needRefresh$$q">
    <div
      class="z-1100 bg-st-tooltip text-st-on-tooltip fixed right-0 bottom-25 m-4 p-4 text-left shadow-md rounded text-base"
      role="alert"
    >
      <div class="flex flex-col gap-y-4 md:min-w-80">
        <div class="leading-normal">
          {{ t('reloadPrompt.message.needsRefresh') }}
        </div>
        <div class="flex gap-x-4 text-right items-center justify-end">
          <VBtn flat text class="bg-transparent" @click="close$$q()">
            {{ t('reloadPrompt.button.Close') }}
          </VBtn>
          <VBtn color="primary" flat text @click="updateServiceWorker$$q()">
            {{ t('reloadPrompt.button.Reload') }}
          </VBtn>
        </div>
      </div>
    </div>
  </template>
</template>
