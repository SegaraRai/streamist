<script lang="ts">
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { useEffectiveTheme } from '~/composables/useEffectiveTheme';
import { LanguageCode, THEMES } from '~/config';
import { NAIVE_UI_THEMES } from '~/logic/theme';
import { loggedInRef } from '~/stores/auth';
import { usePreferenceStore } from '~/stores/preference';

export default defineComponent({
  setup() {
    const { locale, t } = useI18n();
    const preferenceStore = storeToRefs(usePreferenceStore());
    const { themeName$$q } = useEffectiveTheme();

    const rootElement = document.documentElement;

    // sync locale
    biSyncRef(preferenceStore.language, locale as Ref<LanguageCode>);
    watch(
      locale,
      (newLocale: string): void => {
        rootElement.lang = newLocale;
      },
      {
        immediate: true,
      }
    );

    // sync theme
    watch(
      themeName$$q,
      (newTheme): void => {
        const isDark = THEMES[newTheme].dark;
        rootElement.classList.toggle('dark', isDark);
        rootElement.classList.toggle('light', !isDark);
        rootElement.dataset.sTheme = newTheme;
      },
      {
        immediate: true,
      }
    );

    // https://github.com/vueuse/head
    // you can use this to manipulate the document head in any components,
    // they will be rendered correctly in the html results with vite-ssg
    useHead({
      title: t('app.title'),
      meta: [{ name: 'description', content: t('app.meta.description') }],
    });

    const naiveUITheme = eagerComputed(
      () => NAIVE_UI_THEMES[themeName$$q.value]
    );

    return {
      isLoggedIn$$q: loggedInRef,
      naiveUITheme$$q: naiveUITheme,
    };
  },
});
</script>

<template>
  <NConfigProvider
    :theme="naiveUITheme$$q.base"
    :theme-overrides="naiveUITheme$$q.overrides"
  >
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <RouterView />
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
    <NGlobalStyle />
    <template v-if="isLoggedIn$$q">
      <SPlaybackPersistor />
    </template>
  </NConfigProvider>
</template>
