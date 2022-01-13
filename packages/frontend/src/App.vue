<script lang="ts">
import { COOKIE_CHECK_INTERVAL, IDLE_TIMEOUT } from '~/config';
import { renewTokensAndSetCDNCookie } from '~/logic/cdnCookie';
import { NAIVE_UI_THEMES } from '~/logic/theme';
import { usePlaybackStore } from '~/stores/playback';
import { useThemeStore } from '~/stores/theme';

export default defineComponent({
  setup() {
    const themeStore = useThemeStore();
    const naiveUITheme = eagerComputed(() => NAIVE_UI_THEMES[themeStore.theme]);
    const playbackStore = usePlaybackStore();

    const { idle } = useIdle(IDLE_TIMEOUT);

    useIntervalFn(() => {
      const active = !idle.value || playbackStore.playing$$q.value;
      if (!active) {
        return;
      }

      renewTokensAndSetCDNCookie();
    }, COOKIE_CHECK_INTERVAL);

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
  </n-config-provider>
</template>
