<script lang="ts" setup>
import type { ScrollbarInst } from 'naive-ui';
import { useDisplay } from 'vuetify';
import { useSyncDB } from '~/db/sync';
import { getNaiveUIScrollbarElements } from '~/logic/naive-ui/getScrollbarElements';
import {
  currentScrollContainerRef,
  currentScrollContentRef,
  currentScrollRef,
} from '~/stores/scroll';
import { useThemeStore } from '~/stores/theme';
import { useUploadStore } from '~/stores/upload';

const { t } = useI18n();
const router = useRouter();
const isOnline = useOnline();
const display = useDisplay();
const syncDB = useSyncDB();
const theme = useThemeStore();

const uploadDialog$$q = ref(false);

interface NavItemLink {
  type: 'link';
  path: string;
  icon: string;
  text: string;
}

interface NavItemDivider {
  type: 'divider';
}

type NavItem = NavItemLink | NavItemDivider;

const navItems$$q = computed<readonly NavItem[]>(() => [
  {
    type: 'link',
    icon: 'mdi-home',
    path: '/',
    text: t('sidebar.Home'),
  },
  {
    type: 'divider',
  },
  {
    type: 'link',
    icon: 'mdi-album',
    path: '/albums',
    text: t('sidebar.Albums'),
  },
  {
    type: 'link',
    icon: 'mdi-account-music',
    path: '/artists',
    text: t('sidebar.Artists'),
  },
  {
    type: 'link',
    icon: 'mdi-music',
    path: '/tracks',
    text: t('sidebar.Tracks'),
  },
  {
    type: 'link',
    icon: 'mdi-playlist-music',
    path: '/playlists',
    text: t('sidebar.Playlists'),
  },
  // debug
  {
    type: 'divider',
  },
  {
    type: 'link',
    icon: 'mdi-play',
    path: '/playing',
    text: 'Playing',
  },
]);

const uploadStore$$q = useUploadStore();

const fullscreenDialog = eagerComputed(() => display.xs.value);

const rightSidebar$$q = ref(false);
const _leftSidebar$$q = ref(false);
const alwaysShowLeftSidebar$$q = eagerComputed(() => display.mdAndUp.value);
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
</script>

<template>
  <div
    :class="isOnline ? 's-offline--online' : 's-offline--offline'"
    class="min-h-screen flex flex-col print:invisible"
  >
    <div
      class="s-offline-bar bg-yellow-400 h-0 text-white font-weight-bold text-md flex items-center px-4 leading-none z-2200 overflow-hidden"
    >
      {{ t('header.NoInternetConnection') }}
    </div>

    <v-app :theme="theme.theme" class="flex-1 !h-auto">
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
        :theme="theme.rightSidebarTheme"
        :width="400"
        hide-overlay
        class="s-offline-mod-mt select-none"
      >
        <div class="flex flex-col h-full">
          <v-sheet tile>
            <div class="title flex items-center py-1">
              <v-icon class="mx-4">mdi-playlist-play</v-icon>
              <span class="flex-1">{{ t('queue.PlayQueue') }}</span>
              <v-btn flat icon size="small" @click="rightSidebar$$q = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
            <v-divider />
          </v-sheet>
          <n-scrollbar
            class="flex-1 s-n-scrollbar-min-h-full"
            @scroll.passive="onQueueScroll$$q"
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
        :theme="theme.headerTheme"
        class="s-offline-mod-mt"
      >
        <div class="w-full flex justify-between items-center">
          <template v-if="!alwaysShowLeftSidebar$$q">
            <div class="flex-none">
              <template v-if="hideShell$$q">
                <v-btn flat icon text size="small" @click="router.back()">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
              </template>
              <template v-else>
                <v-btn
                  flat
                  icon
                  text
                  size="small"
                  @click="_leftSidebar$$q = !_leftSidebar$$q"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
              </template>
            </div>
          </template>
          <div class="ml-0 pl-2 sm:pr-12 hidden-xs-only select-none flex-none">
            <router-link to="/">
              <span class="text-xl leading-none">streamist</span>
              <span class="text-sm leading-none">.app</span>
            </router-link>
          </div>
          <div class="flex-1 flex gap-x-2 justify-end">
            <v-text-field
              class="s-v-input-hide-details flex-1 max-w-md <sm:hidden"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              hide-details
            />
            <v-btn icon size="small" class="sm:hidden">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="devSync$$q">
              <v-icon>mdi-sync</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="uploadDialog$$q = true">
              <v-badge
                :model-value="!!uploadStore$$q.badge"
                dot
                color="primary"
                text-color="primary"
                bordered
              >
                <v-icon>mdi-cloud-upload</v-icon>
              </v-badge>
            </v-btn>
            <v-btn icon size="small" @click="rightSidebar$$q = true">
              <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
          </div>
        </div>
      </v-app-bar>

      <!-- Left Sidebar: Navigation -->
      <!-- not setting !z-2120 because it makes tooltips hidden -->
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
            <v-list dense class="overflow-x-hidden">
              <template v-for="(item, _index) in navItems$$q" :key="_index">
                <template v-if="item.type === 'link'">
                  <v-list-item link :to="item.path">
                    <v-list-item-avatar
                      icon
                      class="flex items-center justify-center"
                    >
                      <v-icon>{{ item.icon }}</v-icon>
                    </v-list-item-avatar>
                    <v-list-item-header>
                      {{ item.text }}
                    </v-list-item-header>
                  </v-list-item>
                </template>
                <template v-else-if="item.type === 'divider'">
                  <v-divider />
                </template>
              </template>
            </v-list>
            <div class="flex-1"></div>
            <div class="text-xs ml-2 text-right text-red-400 p-2">
              ALPHA VERSION<br />
              no warranty / use with caution
            </div>
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

      <v-dialog
        v-model="uploadDialog$$q"
        class="s-v-dialog select-none"
        :fullscreen="fullscreenDialog"
      >
        <v-card class="w-full">
          <v-card-title class="flex">
            <div class="flex-1">Upload</div>
            <div class="flex-none">
              <v-btn
                flat
                icon
                size="x-small"
                class="text-red-500"
                @click="uploadDialog$$q = false"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text class="opacity-100">
            <s-uploader />
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-app>

    <footer
      class="select-none playback-sheet fixed bottom-0 z-100 w-full m-0 p-0 h-24"
      :class="hideShell$$q && '!hidden'"
      @contextmenu.prevent
    >
      <v-sheet class="m-0 p-0 w-full h-full flex flex-col">
        <v-divider />
        <s-playback-control class="<md:hidden" />
        <s-mobile-playback-control class="md:hidden" />
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
