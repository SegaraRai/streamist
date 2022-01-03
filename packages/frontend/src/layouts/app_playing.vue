<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import { useSyncDB } from '~/db/sync';
import { currentScrollRef } from '~/stores/scroll';
import { useThemeStore } from '~/stores/theme';
import { useUploadStore } from '~/stores/upload';

const { t } = useI18n();
const theme = useThemeStore();
const display = useDisplay();
const syncDB = useSyncDB();

const uploadDialog = ref(false);

const uploadStore = useUploadStore();

const rightSidebar = ref(false);

const fullscreenDialog = computed(() => display.xs.value);

const devSync = (event: MouseEvent) => {
  syncDB(event.shiftKey);
};

const isOnline = useOnline();

const onScroll$$q = (e: Event): void => {
  currentScrollRef.value = (e.target as HTMLElement).scrollTop;
  // console.log(currentScrollRef.value);
};
</script>

<template>
  <div :class="isOnline ? 's-offline--online' : 's-offline--offline'">
    <div
      class="s-offline-bar bg-yellow-400 h-0 text-white font-weight-bold text-md flex items-center px-4 leading-none z-2200 overflow-hidden"
    >
      No Internet connection.
    </div>
    <v-app theme="dark">
      <div
        class="bg-black z-2135 fixed top-0 left-0 w-full h-full transition-all"
        :class="rightSidebar ? 'opacity-25' : 'opacity-0 invisible'"
        @click="rightSidebar = false"
        @contextmenu.prevent
      ></div>

      <v-navigation-drawer
        :model-value="rightSidebar"
        temporary
        position="right"
        :theme="theme.rightSidebarTheme"
        :width="400"
        hide-overlay
        class="s-offline-mod-mt select-none !z-2140"
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
          <n-scrollbar class="flex-1">
            <s-queue />
          </n-scrollbar>
          <div class="s-offline-mod-h"></div>
        </div>
      </v-navigation-drawer>

      <v-app-bar
        flat
        :border="1"
        density="compact"
        :theme="theme.headerTheme"
        class="s-offline-mod-mt !z-2130"
      >
        <div class="w-full flex justify-between items-center">
          <div class="ml-0 pl-4 pr-12 hidden-xs-only select-none flex-none">
            <span class="text-xl leading-none">streamist</span>
            <span class="text-sm leading-none">.app</span>
          </div>
          <div class="sm:flex-1 flex gap-x-2 justify-end">
            <v-text-field
              class="s-search-box flex-1 max-w-md <sm:hidden"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              :hide-details="true"
            />
            <v-btn icon size="small" class="sm:hidden">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="devSync">
              <v-icon>mdi-sync</v-icon>
            </v-btn>
            <v-btn icon size="small" @click="uploadDialog = true">
              <v-badge
                :model-value="!!uploadStore.badge"
                dot
                color="primary"
                text-color="primary"
                bordered
              >
                <v-icon>mdi-cloud-upload</v-icon>
              </v-badge>
            </v-btn>
            <v-btn icon size="small" @click="rightSidebar = true">
              <v-icon>mdi-playlist-play</v-icon>
            </v-btn>
          </div>
        </div>
      </v-app-bar>

      <v-main class="s-v-main !absolute w-full h-full">
        <n-scrollbar
          class="s-scroll-target flex-1 !h-auto"
          @scroll="onScroll$$q"
        >
          <router-view class="px-4" />
        </n-scrollbar>
      </v-main>

      <v-dialog
        v-model="uploadDialog"
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

/* I don't know why but details appears whatever we set hide-details */
.s-search-box .v-input__details {
  @apply hidden;
}

.s-v-main.v-main > .v-main__wrap {
  @apply flex;
  @apply flex-col;
  @apply h-full;
}

.s-scroll-target > .n-scrollbar-container > .n-scrollbar-content {
  @apply min-h-full;
}

html {
  overflow: hidden;
}
</style>
