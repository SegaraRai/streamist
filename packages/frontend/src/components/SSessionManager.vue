<script lang="ts">
import type { DeviceType } from '$shared/types';
import { useWS } from '~/composables/useWS';

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
  setup() {
    const { t } = useI18n();
    const { sessions$$q, setHost$$q } = useWS();

    return {
      t,
      popover: ref<any>(null),
      getDeviceIcon$$q: getDeviceIcon,
      sessions$$q: computed(() =>
        [...sessions$$q.value].sort((a, b) => (b.you ? 1 : 0) - (a.you ? 1 : 0))
      ),
      setHost$$q,
    };
  },
});
</script>

<template>
  <NPopover ref="popover" placement="top" trigger="click">
    <template #trigger>
      <button
        class="flex items-center justify-center transition-colors select-none"
        :class="sessions$$q.length > 1 ? 'text-st-primary' : ''"
      >
        <IMdiTabletCellphone />
      </button>
    </template>
    <div class="-m-4">
      <VList class="min-w-60 select-none">
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
              <VIcon>{{ getDeviceIcon$$q(session.info.type) }}</VIcon>
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
