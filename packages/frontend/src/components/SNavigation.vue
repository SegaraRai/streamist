<script lang="ts">
import IconAccountMusic from '~icons/mdi/account-music?raw';
import IconAlbum from '~icons/mdi/album?raw';
import IconCog from '~icons/mdi/cog?raw';
import IconHome from '~icons/mdi/home?raw';
import IconMusic from '~icons/mdi/music?raw';
import IconPlaylistMusic from '~icons/mdi/playlist-music?raw';

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

export default defineComponent({
  setup() {
    const { t } = useI18n();

    const navItems$$q = computed<readonly NavItem[]>(() => [
      {
        type: 'link',
        icon: IconHome,
        path: '/',
        text: t('sidebar.Home'),
      },
      {
        type: 'divider',
      },
      {
        type: 'link',
        icon: IconAlbum,
        path: '/albums',
        text: t('sidebar.Albums'),
      },
      {
        type: 'link',
        icon: IconAccountMusic,
        path: '/artists',
        text: t('sidebar.Artists'),
      },
      {
        type: 'link',
        icon: IconMusic,
        path: '/tracks',
        text: t('sidebar.Tracks'),
      },
      {
        type: 'link',
        icon: IconPlaylistMusic,
        path: '/playlists',
        text: t('sidebar.Playlists'),
      },
      {
        type: 'divider',
      },
      {
        type: 'link',
        icon: IconCog,
        path: '/settings',
        text: t('sidebar.Settings'),
      },
    ]);

    return {
      navItems$$q,
    };
  },
});
</script>

<template>
  <VList dense class="overflow-x-hidden">
    <template v-for="(item, _index) in navItems$$q" :key="_index">
      <template v-if="item.type === 'link'">
        <VListItem link :to="item.path" :_="(_index || undefined) && undefined">
          <VListItemAvatar icon class="flex items-center justify-center">
            <span
              class="flex items-center justify-center text-base opacity-60"
              v-html="item.icon"
            ></span>
          </VListItemAvatar>
          <VListItemHeader class="pl-2">
            <VListItemTitle class="s-heading-sl text-sm">
              {{ item.text }}
            </VListItemTitle>
          </VListItemHeader>
        </VListItem>
      </template>
      <template v-else-if="item.type === 'divider'">
        <VDivider />
      </template>
    </template>
  </VList>
</template>
