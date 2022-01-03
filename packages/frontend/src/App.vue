<script setup lang="ts">
import { darkTheme as nDarkTheme$$q } from 'naive-ui';

// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Streamist',
  meta: [{ name: 'description', content: 'A streaming service for yourself' }],
});
</script>

<template>
  <n-config-provider :theme="nDarkTheme$$q">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>
