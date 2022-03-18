<script lang="ts">
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { useEffectiveTheme } from '~/composables';
import { LanguageCode, THEMES } from '~/config';
import { checkAPIStatus } from '~/logic/apiCheck';
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
    syncRef(preferenceStore.language, locale as Ref<LanguageCode>, {
      direction: 'ltr',
    });
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

    const naiveUITheme = computedEager(
      () => NAIVE_UI_THEMES[themeName$$q.value]
    );

    onBeforeMount(() => {
      if (location.pathname === '/auth') {
        return;
      }

      checkAPIStatus().then((status) => {
        switch (status) {
          case 'ng_needs_auth':
            location.replace(
              '/auth?to=' + encodeURIComponent(location.pathname)
            );
            break;
        }
      });
    });

    return {
      isLoggedIn$$q: loggedInRef,
      naiveUITheme$$q: naiveUITheme,
    };
  },
});
</script>

<template>
  <NConfigProvider
    class="h-full"
    :theme="naiveUITheme$$q.base"
    :theme-overrides="naiveUITheme$$q.overrides"
  >
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <RouterView />
          <template v-if="isLoggedIn$$q">
            <SReloadPrompt />
          </template>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
    <NGlobalStyle />
    <template v-if="isLoggedIn$$q">
      <SPlaybackPersistor />
      <SConfirmOnLeaveHandler />
    </template>
  </NConfigProvider>
</template>
