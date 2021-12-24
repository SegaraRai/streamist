<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import { useThemeStore } from '~/stores/theme';

const { t } = useI18n();
const theme = useThemeStore();
const display = useDisplay();
</script>

<template>
  <v-app theme="dark">
    <v-main>
      <router-view class="px-4" />
      <div class="h-24"></div>
    </v-main>
  </v-app>
</template>
