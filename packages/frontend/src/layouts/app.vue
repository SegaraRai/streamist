<script lang="ts">
import { RouteLocation, onBeforeRouteUpdate } from 'vue-router';
import { useDisplay } from 'vuetify';
import logoSVG from '~/assets/logo_colored.svg';
import { useEffectiveTheme, useWS } from '~/composables';
import { COOKIE_CHECK_INTERVAL, IDLE_TIMEOUT } from '~/config';
import { useSyncDB } from '~/db';
import { renewTokensAndSetCDNCookie } from '~/logic/cdnCookie';
import { usePlaybackStore } from '~/stores/playback';
import {
  currentScrollContainerRef,
  currentScrollContentRef,
  currentScrollRef,
} from '~/stores/scroll';
import { useUploadStore } from '~/stores/upload';

function isShowPlayingEnabled(route: RouteLocation): boolean {
  return route.hash === '#playing';
}

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

    // playback controls

    const desktopPlaybackControl$$q = computedEager(
      () => display.mdAndUp.value
    );
    const alwaysShowLeftSidebar$$q = desktopPlaybackControl$$q;
    const canShowPlaying$$q = logicNot(desktopPlaybackControl$$q);

    // show playing flag

    const showPlaying$$q = computedEager(
      () =>
        canShowPlaying$$q.value &&
        isShowPlayingEnabled(router.currentRoute.value)
    );

    onBeforeRouteUpdate((to, from) => {
      if (canShowPlaying$$q.value || !isShowPlayingEnabled(to)) {
        return;
      }

      return to.path === from.path ? false : { ...to, hash: '' };
    });

    watch(
      computed(
        () =>
          !canShowPlaying$$q.value &&
          isShowPlayingEnabled(router.currentRoute.value)
      ),
      (shouldRemoveHash) => {
        if (!shouldRemoveHash) {
          return;
        }

        router.replace({
          ...router.currentRoute.value,
          hash: '',
        });
      }
    );

    // sidebars

    const rightSidebar$$q = ref(false);

    const _leftSidebar$$q = ref(false);
    const leftSidebar$$q = computed<boolean>({
      get: (): boolean => {
        return (
          !showPlaying$$q.value &&
          (alwaysShowLeftSidebar$$q.value || _leftSidebar$$q.value)
        );
      },
      set: (value: boolean): void => {
        _leftSidebar$$q.value =
          !showPlaying$$q.value && !alwaysShowLeftSidebar$$q.value && value;
      },
    });

    watchEffect(() => {
      if (alwaysShowLeftSidebar$$q.value) {
        _leftSidebar$$q.value = false;
      }
    });

    // queue scroll

    const queueScroll$$q = ref(0);
    const onQueueScroll$$q = (e: Event): void => {
      queueScroll$$q.value = (e.target as HTMLElement).scrollTop;
    };

    // -- end of setup --

    // token renewal

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

    // sync DB

    // FIXME: Move this to a better place
    // We want to sync DB when the user opens the app (if logged in), or when the user logged in to the app
    syncDB();

    return {
      t,
      logoSVG$$q: logoSVG,
      router$$q: router,
      currentScrollRef$$q: currentScrollRef,
      currentScrollContainerRef$$q: currentScrollContainerRef,
      currentScrollContentRef$$q: currentScrollContentRef,
      emulateScrollbar$$q: display.mdAndUp,
      searchDialog$$q: ref(false),
      uploadDialog$$q: ref(false),
      showPlaying$$q,
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
        :touchless="leftSidebar$$q && !alwaysShowLeftSidebar$$q"
      >
        <div class="flex flex-col h-full">
          <VSheet>
            <div class="title flex items-center py-1 -mb-1px">
              <i-mdi-playlist-play class="ml-4 mr-2 text-xl" />
              <span class="flex-1">{{ t('queue.title') }}</span>
              <VBtn flat icon size="small" @click="rightSidebar$$q = false">
                <i-mdi-chevron-right />
              </VBtn>
            </div>
            <VDivider />
          </VSheet>
          <NScrollbar
            class="flex-1 s-n-scrollbar-min-h-full"
            @scroll="onQueueScroll$$q"
          >
            <template v-if="rightSidebar$$q">
              <SQueue :scroll-top="queueScroll$$q" />
            </template>
          </NScrollbar>
          <div
            class="s-footer-height flex-none"
            :class="showPlaying$$q && '!hidden'"
          ></div>
          <div class="s-offline-mod-h"></div>
        </div>
      </VNavigationDrawer>

      <!-- Header -->
      <!-- BUG: border-b class is needed -->
      <VAppBar
        class="border-b s-offline-mod-mt px-0"
        density="compact"
        :border="1"
      >
        <div class="w-full flex justify-between items-center">
          <template v-if="!alwaysShowLeftSidebar$$q">
            <div class="flex-none">
              <template v-if="showPlaying$$q">
                <VBtn flat icon text size="small" @click="router$$q.back()">
                  <i-mdi-chevron-down />
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
                  <i-mdi-menu />
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
              <i-mdi-magnify />
            </VBtn>
            <VBtn icon size="small" @click="uploadDialog$$q = true">
              <NBadge
                :value="uploadStore$$q.badge"
                :dot="!!uploadStore$$q.badge"
                :processing="!!uploadStore$$q.badge"
              >
                <i-mdi-cloud-upload class="text-st-text" />
              </NBadge>
            </VBtn>
            <VBtn icon size="small" @click="rightSidebar$$q = true">
              <i-mdi-playlist-play />
            </VBtn>
          </div>
        </div>
      </VAppBar>

      <!-- Left Sidebar: Navigation -->
      <VNavigationDrawer
        :model-value="leftSidebar$$q"
        :permanent="alwaysShowLeftSidebar$$q"
        :touchless="
          alwaysShowLeftSidebar$$q || showPlaying$$q || rightSidebar$$q
        "
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
              :class="showPlaying$$q && '!hidden'"
            ></div>
          </div>
        </NScrollbar>
      </VNavigationDrawer>

      <VMain class="s-v-main w-full h-full flex flex-col">
        <SScrollable
          v-model:scroll-y="currentScrollRef$$q"
          class="flex-1"
          :emulate="emulateScrollbar$$q"
          @update:container="currentScrollContainerRef$$q = $event"
          @update:content="currentScrollContentRef$$q = $event"
        >
          <RouterView class="px-4" />
        </SScrollable>
        <div
          class="s-footer-height flex-none"
          :class="showPlaying$$q && '!hidden'"
        ></div>
      </VMain>

      <div
        class="fixed top-0 left-0 w-full h-full transition-all transform-gpu pointer-events-none pt-12 z-10"
        :class="showPlaying$$q ? 'translate-y-0' : 'translate-y-full invisible'"
      >
        <SPlaying
          class="w-full h-full bg-st-background transition-all"
          :class="
            showPlaying$$q
              ? 'pointer-events-auto'
              : 'pointer-events-none invisible'
          "
        />
      </div>
    </VApp>

    <footer
      class="s-footer-height flex-none select-none fixed bottom-0 z-1200 w-full m-0 p-0 transition-all"
      :class="showPlaying$$q && 'opacity-0 invisible pointer-events-none'"
      @contextmenu.prevent
    >
      <!-- we must provide theme explicitly as this is outside of VApp -->
      <VSheet
        class="m-0 p-0 w-full h-full !flex flex-col"
        :theme="themeName$$q"
      >
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
