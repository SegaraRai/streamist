<script lang="ts">
export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();

    const query = new URLSearchParams(location.search);
    router.replace(query.get('to') || '/');

    return {
      t,
    };
  },
});
</script>

<template>
  <div class="mt-6 flex flex-col w-full items-center">
    <div class="text-base">
      {{ t('auth.message') }}
    </div>
  </div>
</template>
