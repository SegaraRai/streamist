<script setup lang="ts">
import { NAIVE_UI_THEMES } from '~/logic/theme';
import { useThemeStore } from '~/stores/theme';

const themeStore$$q = useThemeStore();
const naiveUITheme$$q = eagerComputed(
  () => NAIVE_UI_THEMES[themeStore$$q.theme]
);

const themeClass$$q = eagerComputed(() => `s-theme--${themeStore$$q.theme}`);

const rootElement$$q = document.documentElement;

watch(
  themeClass$$q,
  (currentThemeClass, previousThemeClass) => {
    if (previousThemeClass) {
      rootElement$$q.classList.remove(previousThemeClass);
    }
    rootElement$$q.classList.add(currentThemeClass);
  },
  {
    immediate: true,
  }
);

onBeforeUnmount(() => {
  rootElement$$q.classList.remove(themeClass$$q.value);
});

// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Streamist',
  meta: [{ name: 'description', content: 'A streaming service for yourself' }],
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
  </n-config-provider>
</template>
