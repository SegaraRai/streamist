<script lang="ts">
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
        type: 'divider',
      },
      {
        type: 'link',
        icon: 'mdi-cog',
        path: '/settings',
        text: 'Settings',
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
        <VListItem link :to="item.path">
          <VListItemAvatar icon class="flex items-center justify-center">
            <VIcon>{{ item.icon }}</VIcon>
          </VListItemAvatar>
          <VListItemHeader>
            {{ item.text }}
          </VListItemHeader>
        </VListItem>
      </template>
      <template v-else-if="item.type === 'divider'">
        <VDivider />
      </template>
    </template>
  </VList>
</template>
