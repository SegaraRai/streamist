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
  <v-list dense class="overflow-x-hidden">
    <template v-for="(item, _index) in navItems$$q" :key="_index">
      <template v-if="item.type === 'link'">
        <v-list-item link :to="item.path">
          <v-list-item-avatar icon class="flex items-center justify-center">
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
</template>
