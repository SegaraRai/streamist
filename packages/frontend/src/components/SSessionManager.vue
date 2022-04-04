<script lang="ts">
import type { DeviceType } from '$shared/types';
import { useWS } from '~/composables';

function getDeviceIcon(deviceType: DeviceType): string {
  switch (deviceType) {
    case 'mobile':
      return 'mdi-cellphone';

    case 'desktop':
      return 'mdi-laptop';
  }
  return 'mdi-laptop';
}

export default defineComponent({
  inheritAttrs: false,
  props: {
    showLabel: Boolean,
  },
  setup() {
    const { t } = useI18n();
    const { hostSession$$q, sessions$$q, setHost$$q } = useWS();

    return {
      t,
      popover: ref<any>(null),
      getDeviceIcon$$q: getDeviceIcon,
      hostSession$$q,
      sessions$$q: computed(() =>
        [...sessions$$q.value].sort((a, b) => (b.you ? 1 : 0) - (a.you ? 1 : 0))
      ),
      setHost$$q,
    };
  },
});
</script>

<template>
  <NPopover
    ref="popover"
    placement="top"
    trigger="click"
    :disabled="sessions$$q.length === 0"
  >
    <template #trigger>
      <button
        v-bind="$attrs"
        class="flex gap-x-4 items-center transition-colors select-none"
        :class="sessions$$q.length > 1 ? 'text-st-primary' : ''"
      >
        <i-mdi-tablet-cellphone />
        <template v-if="showLabel && hostSession$$q?.you === false">
          <i18n-t
            keypath="session.ListeningOn"
            tag="div"
            class="flex-1 text-st-primary overflow-hidden overflow-ellipsis"
          >
            <span class="font-bold">
              {{ hostSession$$q.info.name || hostSession$$q.info.platform }}
            </span>
          </i18n-t>
        </template>
      </button>
    </template>
    <div class="-m-4">
      <VList class="min-w-60 select-none !bg-transparent">
        <template v-for="session in sessions$$q" :key="session.id">
          <VListItem
            :class="session.host ? 'text-st-primary' : ''"
            link
            @click="
              session.host || setHost$$q(session.id);
              popover?.setShow(false);
            "
          >
            <VListItemAvatar icon class="flex items-center justify-center px-2">
              <VIcon :icon="getDeviceIcon$$q(session.info.type)" />
            </VListItemAvatar>
            <VListItemHeader class="pl-2">
              <VListItemTitle class="s-heading-sl text-base">
                <i18n-t
                  :keypath="
                    session.host ? 'session.ListeningOn' : 'session.Normal'
                  "
                  tag="div"
                  class="leading-relaxed"
                >
                  <span class="font-bold">
                    {{
                      session.you
                        ? t('session.ThisDevice')
                        : session.info.name || session.info.platform
                    }}
                  </span>
                </i18n-t>
              </VListItemTitle>
              <VListItemSubtitle class="s-subheading-sl text-xs">
                {{ session.info.client }}
              </VListItemSubtitle>
            </VListItemHeader>
          </VListItem>
        </template>
      </VList>
    </div>
  </NPopover>
</template>
