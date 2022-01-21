<script lang="ts">
export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();

    return {
      t,
      back$$q: (): void => {
        router.back();
      },
    };
  },
});
</script>

<template>
  <div class="mt-6 flex flex-col w-full items-center">
    <div class="text-base">
      {{ t('notFound.message') }}
    </div>
    <div class="mt-8">
      <VBtn color="primary" @click="back$$q()">
        {{ t('notFound.button.Back') }}
      </VBtn>
    </div>
  </div>
</template>
