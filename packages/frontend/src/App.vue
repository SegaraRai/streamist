<script lang="ts">
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { NAIVE_UI_THEMES } from '~/logic/theme';
import { useThemeStore } from '~/stores/theme';
import { LanguageCode } from './config';
import { usePreferenceStore } from './stores/preference';

export default defineComponent({
  setup() {
    const preferenceStore = storeToRefs(usePreferenceStore());
    const themeStore = useThemeStore();

    const naiveUITheme = eagerComputed(() => NAIVE_UI_THEMES[themeStore.theme]);

    const { locale } = useI18n();
    biSyncRef(preferenceStore.language, locale as Ref<LanguageCode>);

    const themeClass = eagerComputed(() => `s-theme--${themeStore.theme}`);

    const rootElement = document.documentElement;

    watch(
      themeClass,
      (currentThemeClass, previousThemeClass) => {
        if (previousThemeClass) {
          rootElement.classList.remove(previousThemeClass);
        }
        rootElement.classList.add(currentThemeClass);
      },
      {
        immediate: true,
      }
    );

    onBeforeUnmount(() => {
      rootElement.classList.remove(themeClass.value);
    });

    // https://github.com/vueuse/head
    // you can use this to manipulate the document head in any components,
    // they will be rendered correctly in the html results with vite-ssg
    useHead({
      title: 'Streamist',
      meta: [
        { name: 'description', content: 'A streaming service for yourself' },
      ],
    });

    return {
      naiveUITheme$$q: naiveUITheme,
      themeClass$$q: themeClass,
    };
  },
});
</script>

<template>
  <n-config-provider
    :theme="naiveUITheme$$q.base"
    :theme-overrides="naiveUITheme$$q.overrides"
  >
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <div :class="themeClass$$q">
            <router-view />
          </div>
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
    <n-global-style />
  </n-config-provider>
</template>
