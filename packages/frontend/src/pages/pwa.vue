<route lang="yaml">
meta:
  layout: conditional
</route>

<script lang="ts">
import { usePreferenceStore } from '~/stores/preference';
import { isPWAStarted, setPWAStarted } from '~/stores/pwa';

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const preferenceStore = usePreferenceStore();

    useHead({
      title: t('title.Home'),
    });

    onBeforeMount(() => {
      if (isPWAStarted()) {
        router.forward();
        return;
      }

      setPWAStarted();

      if (history.length === 1 && preferenceStore.pwaPreventClose) {
        router.push('/');
      } else {
        router.replace('/');
      }
    });

    return {};
  },
});
</script>

<template>
  <div></div>
</template>
