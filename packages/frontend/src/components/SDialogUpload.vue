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
  <n-modal
    v-model:show="show$$q"
    transform-origin="center"
    class="select-none max-w-2xl max-h-full"
  >
    <v-card class="w-full flex flex-col">
      <v-card-title class="flex">
        <div class="flex-1">{{ t('dialogComponent.upload.title') }}</div>
        <div class="flex-none">
          <v-btn
            flat
            icon
            size="x-small"
            class="text-st-error"
            @click="show$$q = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-card-text class="opacity-100 flex-1">
        <s-uploader />
      </v-card-text>
    </v-card>
  </n-modal>
</template>
