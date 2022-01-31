<script lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

    const close = (): void => {
      offlineReady.value = false;
      needRefresh.value = false;
    };

    return {
      t,
      offlineReady$$q: offlineReady,
      needRefresh$$q: needRefresh,
      updateServiceWorker$$q: updateServiceWorker,
      close$$q: close,
    };
  },
});
</script>

<template>
  <div
    v-if="offlineReady$$q || needRefresh$$q"
    class="z-99999 bg-st-tooltip text-st-on-tooltip fixed right-0 bottom-25 m-4 p-4 text-left shadow-md rounded text-base"
    role="alert"
  >
    <div class="flex flex-col gap-y-4 md:min-w-80">
      <div class="leading-normal">
        <template v-if="offlineReady$$q">
          {{ t('reloadPrompt.message.offlineReady') }}
        </template>
        <template v-else>
          {{ t('reloadPrompt.message.needsRefresh') }}
        </template>
      </div>
      <div class="flex gap-x-4 text-right items-center justify-end">
        <VBtn flat text class="bg-transparent" @click="close$$q">
          {{ t('reloadPrompt.button.Close') }}
        </VBtn>
        <VBtn
          v-if="needRefresh$$q"
          color="primary"
          flat
          text
          @click="updateServiceWorker$$q()"
        >
          {{ t('reloadPrompt.button.Reload') }}
        </VBtn>
      </div>
    </div>
  </div>
</template>
