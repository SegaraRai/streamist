<script lang="ts">
import { useThemeStore } from '~/stores/theme';

export default defineComponent({
  setup() {
    const theme = useThemeStore();

    return {
      theme$$q: theme,
    };
  },
});
</script>

<template>
  <v-app :theme="theme$$q.theme">
    <v-main>
      <router-view class="px-4" />
      <div class="h-24"></div>
    </v-main>
  </v-app>
</template>
