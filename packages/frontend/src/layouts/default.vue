<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import { useThemeStore } from '@/stores/theme';
import { syncDB } from '~/db/sync';

const { t } = useI18n();
const theme = useThemeStore();
const display = useDisplay();

const uploadDialog = ref(false);

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

const navItems = computed<readonly NavItem[]>(() => [
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
  {
    type: 'link',
    icon: 'mdi-pound',
    path: '/tags',
    text: t('sidebar.Tags'),
  },
  {
    type: 'divider',
  },
  {
    type: 'link',
    icon: 'mdi-playlist-play',
    path: '/queue',
    text: t('sidebar.Queue'),
  },
  {
    type: 'link',
    icon: 'mdi-cloud-download',
    path: '/downloads',
    text: t('sidebar.Downloads'),
  },
  {
    type: 'link',
    icon: 'mdi-cloud-upload',
    path: '/uploads',
    text: t('sidebar.Uploads'),
  },
]);

const railedNavigation = computed(() => display.xs.value);

const rightSidebar = ref(false);

const devSync = (event: MouseEvent) => {
  syncDB(event.shiftKey);
};
</script>

<template>
  <v-app>
    <div
      class="bg-black z-30 fixed top-0 left-0 w-full h-full transition-all"
      :class="rightSidebar ? 'opacity-25' : 'opacity-0 invisible'"
      @click="rightSidebar = false"
    ></div>

    <v-footer class="playback-sheet fixed bottom-0 z-50 w-full m-0 p-0 h-24">
      <v-sheet class="m-0 p-0 w-full h-full flex flex-col">
        <v-divider />
        <div class="px-1 flex-1 flex items-center">
          <s-playback-control />
        </div>
      </v-sheet>
    </v-footer>

    <v-navigation-drawer
      :model-value="rightSidebar"
      temporary
      position="right"
      :theme="theme.rightSidebarTheme"
      :width="400"
      hide-overlay
      class="!z-40"
    >
      <div class="flex flex-col h-full">
        <v-sheet tile>
          <div class="title flex items-center py-1">
            <v-icon class="mx-4">mdi-playlist-play</v-icon>
            <span class="flex-1">{{ t('queue.PlayQueue') }}</span>
            <v-btn flat icon size="small" @click="rightSidebar = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <v-divider />
        </v-sheet>
        <div class="flex-1 overflow-y-auto overflow-x-hidden">
          <s-queue />
        </div>
        <div class="h-24"></div>
      </div>
    </v-navigation-drawer>

    <v-app-bar flat :border="1" density="compact" :theme="theme.headerTheme">
      <div class="ml-0 pl-4 pr-12 hidden-xs-only leading-tight">
        <span class="text-xl">streamist</span>
        <span class="text-sm">.app</span>
      </div>
      <v-text-field
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
        :label="t('header.Search')"
      />
      <v-spacer />
      <div class="flex gap-x-2">
        <v-btn icon size="small" @click="devSync">
          <v-icon>mdi-sync</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="uploadDialog = true">
          <v-icon>mdi-cloud-upload</v-icon>
        </v-btn>
        <v-btn icon size="small" @click="rightSidebar = true">
          <v-icon>mdi-playlist-play</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      permanent
      position="left"
      :rail="railedNavigation"
      rail-width="56"
    >
      <v-list dense class="overflow-x-hidden">
        <template v-for="(item, index) in navItems" :key="index">
          <template v-if="item.type === 'link'">
            <v-list-item link :to="item.path">
              <v-list-item-avatar icon class="flex items-center justify-center">
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-item-avatar>
              <v-list-item-header v-show="!railedNavigation" class="px-4">
                {{ item.text }}
              </v-list-item-header>
            </v-list-item>
          </template>
          <template v-else-if="item.type === 'divider'">
            <v-divider />
          </template>
        </template>
      </v-list>
      <div class="h-24"></div>
    </v-navigation-drawer>

    <v-main :class="theme.bgClass">
      <v-sheet tile :theme="theme.contentTheme" :class="theme.bgClass">
        <router-view />
      </v-sheet>
      <div class="h-24"></div>
    </v-main>

    <v-dialog v-model="uploadDialog" class="s-upload-dialog">
      <v-card class="w-full">
        <v-card-title class="flex">
          <div class="flex-1">Upload</div>
          <div class="flex-none">
            <v-btn
              flat
              icon
              size="x-small"
              class="text-red-500"
              @click="uploadDialog = false"
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
</template>

<style>
.v-dialog.s-upload-dialog .v-overlay__content {
  @apply max-w-full;
  @apply max-h-full;
  @apply w-2xl;
  @apply px-8;
}
</style>
