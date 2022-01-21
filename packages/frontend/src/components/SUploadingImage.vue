<script lang="ts">
import type { PropType } from 'vue';

export default defineComponent({
  props: {
    file: {
      type: Object as PropType<Blob | null | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const url = ref<string | undefined>();

    watch(
      () => props.file,
      (newFile) => {
        if (url.value) {
          URL.revokeObjectURL(url.value);
          url.value = undefined;
        }
        if (newFile) {
          url.value = URL.createObjectURL(newFile);
        }
      },
      { immediate: true }
    );

    onUnmounted(() => {
      if (url.value) {
        URL.revokeObjectURL(url.value);
        url.value = undefined;
      }
    });

    return {
      t,
      url$$q: url,
    };
  },
});
</script>

<template>
  <div class="relative">
    <SNullableImage
      class="w-full h-full"
      :image="url$$q"
      :alt="t('alt.UploadingImage')"
    />
    <div
      class="absolute w-full h-full top-0 left-0 flex items-center justify-center bg-black/60"
    >
      <VProgressCircular indeterminate size="32" />
    </div>
  </div>
</template>
