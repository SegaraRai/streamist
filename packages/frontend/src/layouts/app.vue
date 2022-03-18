<script lang="ts">
import type { ScrollbarInst } from 'naive-ui';
import { useDisplay } from 'vuetify';
import logoSVG from '~/assets/logo_colored.svg';
import { useEffectiveTheme, useWS } from '~/composables';
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
    const { hostSession$$q, sessionType$$q } = useWS();

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

    watch(hideShell$$q, (newHideShell): void => {
      if (!newHideShell) {
        return;
      }

      _leftSidebar$$q.value = false;
    });

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
      hostSessionName$$q: computed(() =>
        hostSession$$q.value?.you === false
          ? hostSession$$q.value.info.name || hostSession$$q.value.info.platform
          : undefined
      ),
      sessionTypeClass$$q: computed(() => {
        switch (sessionType$$q.value) {
          case 'host':
            return 'host';

          case 'hostSibling':
          case 'guest':
            return 'remote';

          default:
            return 'none';
        }
      }),
    };
  },
});
</script>

<template>
  <div
    :class="[
      isOnline$$q ? 's-offline--online' : 's-offline--offline',
      `s-session--${sessionTypeClass$$q}`,
      desktopPlaybackControl$$q ? 's-playback--desktop' : 's-playback--mobile',
    ]"
    class="min-h-screen flex flex-col"
  >
    <div
      class="s-offline-bar bg-yellow-500 h-0 text-white font-medium text-md flex items-center px-4 leading-none z-1200 overflow-hidden"
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
      <!-- remove disable-resize-watcher when https://github.com/vuetifyjs/vuetify/commit/3dc57e2ff5c67d6547ed3e0a278d340672db84f8 is released -->
      <VNavigationDrawer
        v-model="rightSidebar$$q"
        temporary
        position="right"
        :width="400"
        disable-resize-watcher
        class="s-offline-mod-mt select-none"
      >
        <div class="flex flex-col h-full">
          <VSheet tile>
            <div class="title flex items-center py-1 -mb-1px">
              <VIcon class="ml-4 mr-2">mdi-playlist-play</VIcon>
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
          <div
            class="s-footer-height flex-none"
            :class="hideShell$$q && '!hidden'"
          ></div>
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
                  <i-mdi-magnify />
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
      <VNavigationDrawer
        :model-value="leftSidebar$$q && !hideShell$$q"
        :permanent="alwaysShowLeftSidebar$$q"
        :touchless="alwaysShowLeftSidebar$$q || rightSidebar$$q"
        position="left"
        rail-width="56"
        class="select-none"
        @update:model-value="leftSidebar$$q = $event"
      >
        <NScrollbar
          class="s-offline-mod-pt s-n-scrollbar-min-h-full s-n-scrollbar-flex-col h-full"
        >
          <div class="flex-1 flex flex-col h-full">
            <SNavigation />
            <div
              class="s-footer-height flex-none"
              :class="hideShell$$q && '!hidden'"
            ></div>
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
        <div
          class="s-footer-height flex-none"
          :class="hideShell$$q && '!hidden'"
        ></div>
      </VMain>
    </VApp>

    <footer
      class="s-footer-height flex-none select-none fixed bottom-0 z-1200 w-full m-0 p-0"
      :class="hideShell$$q && '!hidden'"
      @contextmenu.prevent
    >
      <!-- we must provide theme explicitly as this is outside of VApp -->
      <VSheet class="m-0 p-0 w-full h-full flex flex-col" :theme="themeName$$q">
        <VDivider />
        <template v-if="desktopPlaybackControl$$q">
          <SPlaybackControl />
          <template v-if="sessionTypeClass$$q === 'remote'">
            <div
              class="h-6 bg-st-primary text-st-on-primary px-2 flex justify-end items-center"
            >
              <i18n-t
                keypath="session.ListeningOn"
                tag="div"
                class="min-w-60 leading-none"
              >
                <span class="font-bold mx-1">
                  {{ hostSessionName$$q }}
                </span>
              </i18n-t>
            </div>
          </template>
        </template>
        <template v-else>
          <SMobilePlaybackControl :session-name="hostSessionName$$q" />
        </template>
      </VSheet>
    </footer>
  </div>
</template>

<style>
.s-offline--offline .s-offline-mod-mt {
  @apply mt-6 !important;
}

.s-offline--offline .s-offline-mod-pt {
  @apply pt-6 !important;
}

.s-offline--offline .s-offline-mod-h,
.s-offline--offline .s-offline-bar {
  @apply h-6 !important;
}

.s-footer-height {
  @apply h-24;
}

.s-playback--desktop.s-session--remote .s-footer-height {
  @apply h-30;
}
</style>
