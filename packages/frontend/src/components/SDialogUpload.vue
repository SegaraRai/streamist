<script lang="ts">
export default defineComponent({
  props: {
    modelValue: Boolean,
  },
  emits: {
    'update:modelValue': (_modelValue: boolean) => true,
  },
  setup(props, { emit }) {
    const { t } = useI18n();

    const show$$q = useVModel(props, 'modelValue', emit);

    return {
      t,
      show$$q,
    };
  },
});
</script>

<template>
  <NModal
    v-model:show="show$$q"
    transform-origin="center"
    class="select-none max-w-2xl max-h-full"
  >
    <VCard class="w-full flex flex-col">
      <VCardTitle class="flex">
        <div class="flex-1">{{ t('dialogComponent.upload.title') }}</div>
        <div class="flex-none">
          <VBtn
            flat
            icon
            size="x-small"
            class="text-st-error"
            @click="show$$q = false"
          >
            <VIcon icon="mdi-close" />
          </VBtn>
        </div>
      </VCardTitle>
      <VCardText class="opacity-100 flex-1">
        <SUploader class="h-140" />
      </VCardText>
    </VCard>
  </NModal>
</template>
