<route lang="yaml">
meta:
  layout: auth
</route>

<script lang="ts">
export default defineComponent({
  setup() {
    const { t } = useI18n();

    useHead({
      title: t('title.Logout'),
    });

    localStorage.removeItem('refreshToken');

    return {
      t,
    };
  },
});
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-4">
    <div>Logged out.</div>
    <v-btn to="/login">Home</v-btn>
  </div>
</template>
