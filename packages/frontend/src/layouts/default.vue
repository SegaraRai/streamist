<script lang="ts">
import type { ScrollbarInst } from 'naive-ui';
import { useDisplay } from 'vuetify';
import logoSVG from '~/assets/logo_colored.svg';
import { useSyncDB } from '~/db';
import { getNaiveUIScrollbarElements } from '~/logic/naiveUI/getScrollbarElements';
import {
  currentScrollContainerRef,
  currentScrollContentRef,
  currentScrollRef,
} from '~/stores/scroll';
import { useThemeStore } from '~/stores/theme';
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const router = useRouter();
    const isOnline = useOnline();
    const display = useDisplay();
    const syncDB = useSyncDB();
    const theme = useThemeStore();

    const uploadStore$$q = useUploadStore();

    const rightSidebar$$q = ref(false);
    const _leftSidebar$$q = ref(false);
    const alwaysShowLeftSidebar$$q = eagerComputed(() => display.mdAndUp.value);
    const desktopPlaybackControl$$q = alwaysShowLeftSidebar$$q;
    const leftSidebar$$q = computed<boolean>({
      get: (): boolean => {
        return alwaysShowLeftSidebar$$q.value || _leftSidebar$$q.value;
      },
      set: (value: boolean): void => {
        _leftSidebar$$q.value = !alwaysShowLeftSidebar$$q.value && value;
      },
    });

    watchEffect(() => {
      if (alwaysShowLeftSidebar$$q.value) {
        _leftSidebar$$q.value = false;
      }
    });

    const devSync$$q = (event: MouseEvent) => {
      syncDB(event.shiftKey);
    };

    const queueScroll$$q = ref(0);
    const onQueueScroll$$q = (e: Event): void => {
      queueScroll$$q.value = (e.target as HTMLElement).scrollTop;
    };

    const hideShell$$q = eagerComputed(
      () => !!router.currentRoute.value.meta.hideShell
    );

    const scrollRef$$q = ref<ScrollbarInst | undefined>();

    onMounted(() => {
      if (!scrollRef$$q.value) {
        return;
      }

      const { container$$q, content$$q } = getNaiveUIScrollbarElements(
        scrollRef$$q.value
      );
      if (!container$$q || !content$$q) {
        return;
      }

      currentScrollContainerRef.value = container$$q;
      currentScrollContentRef.value = content$$q;
    });

    onBeforeUnmount(() => {
      currentScrollContainerRef.value = undefined;
      currentScrollContentRef.value = undefined;
    });

    useEventListener(
      currentScrollContainerRef,
      'scroll',
      (e) => {
        currentScrollRef.value = (e.target as HTMLElement).scrollTop;
      },
      { passive: true }
    );

    syncDB();

    return {
      t,
      router$$q: router,
      scrollRef$$q,
      searchDialog$$q: ref(false),
      uploadDialog$$q: ref(false),
      devSync$$q,
      hideShell$$q,
      queueScroll$$q,
      onQueueScroll$$q,
      uploadStore$$q,
      rightSidebar$$q,
      leftSidebar$$q,
      isOnline$$q: isOnline,
      theme$$q: theme,
      alwaysShowLeftSidebar$$q,
      desktopPlaybackControl$$q,
      logoSVG$$q: logoSVG,
    };
  },
});
</script>

<template>
  <div
    :class="isOnline$$q ? 's-offline--online' : 's-offline--offline'"
    class="min-h-screen flex flex-col"
  >
    <div
      class="s-offline-bar bg-yellow-400 h-0 text-light-900 font-medium text-md flex items-center px-4 leading-none z-1000 overflow-hidden"
    >
      {{ t('header.NoInternetConnection') }}
    </div>

    <v-app :theme="theme$$q.theme" class="flex-1 !h-auto">
      <!-- we have to place this inside the app to apply theme -->
      <s-dialog-search v-model="searchDialog$$q" />
      <s-dialog-upload v-model="uploadDialog$$q" />

      <!-- div
        class="bg-black z-2135 fixed top-0 left-0 w-full h-full transition-all"
        :class="rightSidebar$$q ? 'opacity-25' : 'opacity-0 invisible'"
        @click="rightSidebar$$q = false"
        @contextmenu.prevent
      ></div -->

      <!-- Right Sidebar: Queue -->
      <v-navigation-drawer
        :model-value="rightSidebar$$q"
        temporary
        position="right"
        :theme="theme$$q.rightSidebarTheme"
        :width="400"
        hide-overlay
        class="s-offline-mod-mt select-none"
      >
        <div class="flex flex-col h-full">
          <v-sheet tile>
            <div class="title flex items-center py-1 -mb-1px">
              <v-icon class="mx-4">mdi-playlist-play</v-icon>
              <span class="flex-1">{{ t('queue.title') }}</span>
              <v-btn flat icon size="small" @click="rightSidebar$$q = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            <v-divider />
          </v-sheet>
          <n-scrollbar
            class="flex-1 s-n-scrollbar-min-h-full"
            @scroll="onQueueScroll$$q"
          >
            <s-queue :scroll-top="queueScroll$$q" />
          </n-scrollbar>
          <div class="h-24" :class="hideShell$$q && '!hidden'"></div>
          <div class="s-offline-mod-h"></div>
        </div>
      </v-navigation-drawer>

      <!-- Header -->
      <v-app-bar
        flat
        :border="1"
        density="compact"
        :theme="theme$$q.headerTheme"
        class="s-offline-mod-mt"
      >
        <div class="w-full flex justify-between items-center">
          <template v-if="!alwaysShowLeftSidebar$$q">
            <div class="flex-none">
              <template v-if="hideShell$$q">
                <v-btn flat icon text size="small" @click="router$$q.back()">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn
                  flat
                  icon
                  text
                  size="small"
                  @click="leftSidebar$$q = !leftSidebar$$q"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
              </template>
            </div>
          </template>
          <div class="ml-0 pl-2 sm:pr-12 hidden-xs-only select-none flex-none">
            <router-link
              to="/"
              class="flex items-center gap-x-1"
              aria-label="Streamist Logo"
            >
              <img
                :src="logoSVG$$q"
                width="128"
                height="128"
                class="block w-7 h-7 pointer-events-none"
                alt="Streamist Logo"
              />
              <span class="inline-block <sm:hidden" aria-hidden="true">
                <span class="text-xl leading-none">streamist</span>
                <span class="text-sm leading-none">.app</span>
              </span>
            </router-link>
          </div>
          <div class="flex-1 flex gap-x-2 justify-end items-center">
            <n-button
              class="<sm:hidden"
              ghost
              round
              @click="searchDialog$$q = true"
            >
              <template #icon>
                <n-icon>
                  <i-mdi-magnify />
                </n-icon>
              </template>
              <v-kbd>Ctrl+K</v-kbd>
            </n-button>
            <v-btn
              class="sm:hidden"
              icon
              size="small"
              @click="searchDialog$$q = true"
            >
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="devSync$$q">
              <v-icon>mdi-sync</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="uploadDialog$$q = true">
              <n-badge
                :value="uploadStore$$q.badge"
                :dot="!!uploadStore$$q.badge"
                :processing="!!uploadStore$$q.badge"
              >
                <v-icon class="text-st-text">mdi-cloud-upload</v-icon>
              </n-badge>
            </v-btn>
            <v-btn icon size="small" @click="rightSidebar$$q = true">
              <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
          </div>
        </div>
      </v-app-bar>

      <!-- Left Sidebar: Navigation -->
      <!-- TODO: hide sidebar on click outside -->
      <v-navigation-drawer
        :model-value="leftSidebar$$q && !hideShell$$q"
        :permanent="alwaysShowLeftSidebar$$q"
        position="left"
        rail-width="56"
        class="s-offline-mod-mt select-none"
        @update:model-value="leftSidebar$$q = $event"
      >
        <n-scrollbar
          class="h-full s-n-scrollbar-min-h-full s-n-scrollbar-flex-col"
        >
          <div class="flex-1 flex flex-col h-full">
            <s-navigation />
            <div class="s-offline-mod-h"></div>
            <div class="h-24" :class="hideShell$$q && '!hidden'"></div>
          </div>
        </n-scrollbar>
      </v-navigation-drawer>

      <v-main class="s-v-main w-full">
        <n-scrollbar
          ref="scrollRef$$q"
          class="s-scroll-target s-n-scrollbar-min-h-full flex-1 !h-auto"
        >
          <router-view class="px-4" />
        </n-scrollbar>
        <div class="flex-none h-24" :class="hideShell$$q && '!hidden'"></div>
      </v-main>
    </v-app>

    <footer
      class="select-none fixed bottom-0 z-100 w-full m-0 p-0 h-24"
      :class="hideShell$$q && '!hidden'"
      @contextmenu.prevent
    >
      <v-sheet
        :theme="theme$$q.theme"
        class="m-0 p-0 w-full h-full flex flex-col"
      >
        <v-divider />
        <template v-if="desktopPlaybackControl$$q">
          <s-playback-control />
        </template>
        <template v-else>
          <s-mobile-playback-control />
        </template>
      </v-sheet>
    </footer>
  </div>
</template>

<style>
.s-offline--offline .s-offline-mod-mt {
  @apply mt-6 !important;
}

.s-offline--offline .s-offline-mod-h,
.s-offline--offline .s-offline-bar {
  @apply h-6 !important;
}

.s-v-main.v-main > .v-main__wrap {
  @apply flex;
  @apply flex-col;
  @apply h-full;
}

html.s-static-layout {
  overflow: hidden;
}

html.s-static-layout .s-v-main.v-main {
  @apply !absolute;
  @apply h-full;
}
</style>
