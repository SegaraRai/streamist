<script lang="ts">
import type { ScrollbarInst } from 'naive-ui';
import { useDisplay } from 'vuetify';
import logoSVG from '~/assets/logo_colored.svg';
import { useEffectiveTheme } from '~/composables/useEffectiveTheme';
import { COOKIE_CHECK_INTERVAL, IDLE_TIMEOUT } from '~/config';
import { useSyncDB } from '~/db';
import { renewTokensAndSetCDNCookie } from '~/logic/cdnCookie';
import { getNaiveUIScrollbarElements } from '~/logic/naiveUI/getScrollbarElements';
import { usePlaybackStore } from '~/stores/playback';
import {
  currentScrollContainerRef,
  currentScrollContentRef,
  currentScrollRef,
} from '~/stores/scroll';
import { useUploadStore } from '~/stores/upload';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const router = useRouter();
    const isOnline = useOnline();
    const display = useDisplay();
    const syncDB = useSyncDB();
    const uploadStore$$q = useUploadStore();
    const playbackStore = usePlaybackStore();
    const { themeName$$q } = useEffectiveTheme();

    const { idle } = useIdle(IDLE_TIMEOUT);

    useIntervalFn(
      () => {
        const active = !idle.value || playbackStore.playing$$q.value;
        if (!active) {
          return;
        }

        renewTokensAndSetCDNCookie();
      },
      COOKIE_CHECK_INTERVAL,
      {
        immediate: true,
      }
    );

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

    // FIXME: Move this to a better place
    // We want to sync DB when the user opens the app (if logged in), or when the user logged in to the app
    syncDB();

    return {
      t,
      logoSVG$$q: logoSVG,
      router$$q: router,
      scrollRef$$q,
      searchDialog$$q: ref(false),
      uploadDialog$$q: ref(false),
      hideShell$$q,
      queueScroll$$q,
      onQueueScroll$$q,
      uploadStore$$q,
      rightSidebar$$q,
      leftSidebar$$q,
      isOnline$$q: isOnline,
      themeName$$q,
      alwaysShowLeftSidebar$$q,
      desktopPlaybackControl$$q,
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

    <VApp :theme="themeName$$q" class="flex-1 !h-auto">
      <!-- we have to place this inside the app to apply theme -->
      <SDialogSearch v-model="searchDialog$$q" />
      <SDialogUpload v-model="uploadDialog$$q" />

      <!-- div
        class="bg-black z-2135 fixed top-0 left-0 w-full h-full transition-all"
        :class="rightSidebar$$q ? 'opacity-25' : 'opacity-0 invisible'"
        @click="rightSidebar$$q = false"
        @contextmenu.prevent
      ></div -->

      <!-- Right Sidebar: Queue -->
      <VNavigationDrawer
        :model-value="rightSidebar$$q"
        temporary
        position="right"
        :width="400"
        hide-overlay
        class="s-offline-mod-mt select-none"
      >
        <div class="flex flex-col h-full">
          <VSheet tile>
            <div class="title flex items-center py-1 -mb-1px">
              <VIcon class="mx-4">mdi-playlist-play</VIcon>
              <span class="flex-1">{{ t('queue.title') }}</span>
              <VBtn flat icon size="small" @click="rightSidebar$$q = false">
                <VIcon>mdi-close</VIcon>
              </VBtn>
            </div>
            <VDivider />
          </VSheet>
          <NScrollbar
            class="flex-1 s-n-scrollbar-min-h-full"
            @scroll="onQueueScroll$$q"
          >
            <SQueue :scroll-top="queueScroll$$q" />
          </NScrollbar>
          <div class="h-24" :class="hideShell$$q && '!hidden'"></div>
          <div class="s-offline-mod-h"></div>
        </div>
      </VNavigationDrawer>

      <!-- Header -->
      <VAppBar flat :border="1" density="compact" class="s-offline-mod-mt">
        <div class="w-full flex justify-between items-center">
          <template v-if="!alwaysShowLeftSidebar$$q">
            <div class="flex-none">
              <template v-if="hideShell$$q">
                <VBtn flat icon text size="small" @click="router$$q.back()">
                  <VIcon>mdi-arrow-left</VIcon>
                </VBtn>
              </template>
              <template v-else>
                <VBtn
                  flat
                  icon
                  text
                  size="small"
                  @click="leftSidebar$$q = !leftSidebar$$q"
                >
                  <VIcon>mdi-menu</VIcon>
                </VBtn>
              </template>
            </div>
          </template>
          <div class="ml-0 pl-2 sm:pr-12 hidden-xs-only select-none flex-none">
            <RouterLink
              to="/"
              class="flex items-center gap-x-1"
              aria-label="Streamist Logo"
            >
              <img
                :src="logoSVG$$q"
                width="128"
                height="128"
                class="block w-7 h-7 select-none pointer-events-none"
                alt="Streamist Logo"
              />
              <span class="inline-block <sm:hidden" aria-hidden="true">
                <span class="text-xl leading-none">streamist</span>
                <span class="text-sm leading-none">.app</span>
              </span>
            </RouterLink>
          </div>
          <div class="flex-1 flex gap-x-2 justify-end items-center">
            <NButton
              class="<sm:hidden"
              ghost
              round
              @click="searchDialog$$q = true"
            >
              <template #icon>
                <NIcon>
                  <IMdiMagnify />
                </NIcon>
              </template>
              <VKbd>Ctrl+K</VKbd>
            </NButton>
            <VBtn
              class="sm:hidden"
              icon
              size="small"
              @click="searchDialog$$q = true"
            >
              <VIcon>mdi-magnify</VIcon>
            </VBtn>
            <VBtn icon size="small" @click="uploadDialog$$q = true">
              <NBadge
                :value="uploadStore$$q.badge"
                :dot="!!uploadStore$$q.badge"
                :processing="!!uploadStore$$q.badge"
              >
                <VIcon class="text-st-text">mdi-cloud-upload</VIcon>
              </NBadge>
            </VBtn>
            <VBtn icon size="small" @click="rightSidebar$$q = true">
              <VIcon>mdi-playlist-play</VIcon>
            </VBtn>
          </div>
        </div>
      </VAppBar>

      <!-- Left Sidebar: Navigation -->
      <!-- TODO: hide sidebar on click outside -->
      <VNavigationDrawer
        :model-value="leftSidebar$$q && !hideShell$$q"
        :permanent="alwaysShowLeftSidebar$$q"
        position="left"
        rail-width="56"
        class="s-offline-mod-mt select-none"
        @update:model-value="leftSidebar$$q = $event"
      >
        <NScrollbar
          class="h-full s-n-scrollbar-min-h-full s-n-scrollbar-flex-col"
        >
          <div class="flex-1 flex flex-col h-full">
            <SNavigation />
            <div class="s-offline-mod-h"></div>
            <div class="h-24" :class="hideShell$$q && '!hidden'"></div>
          </div>
        </NScrollbar>
      </VNavigationDrawer>

      <VMain class="s-v-main w-full">
        <NScrollbar
          ref="scrollRef$$q"
          class="s-scroll-target s-n-scrollbar-min-h-full flex-1 !h-auto"
        >
          <RouterView class="px-4" />
        </NScrollbar>
        <div class="flex-none h-24" :class="hideShell$$q && '!hidden'"></div>
      </VMain>
    </VApp>

    <footer
      class="select-none fixed bottom-0 z-100 w-full m-0 p-0 h-24"
      :class="hideShell$$q && '!hidden'"
      @contextmenu.prevent
    >
      <VSheet class="m-0 p-0 w-full h-full flex flex-col">
        <VDivider />
        <KeepAlive>
          <template v-if="desktopPlaybackControl$$q">
            <SPlaybackControl />
          </template>
          <template v-else>
            <SMobilePlaybackControl />
          </template>
        </KeepAlive>
      </VSheet>
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
