<script setup lang="ts">
import { useUserStore } from '~/stores/user';

const user = useUserStore();
const name = ref(user.savedName);

const router = useRouter();
const go = () => {
  if (name.value) router.push(`/hi/${encodeURIComponent(name.value)}`);
};

const { t } = useI18n();
</script>

<template>
  <v-container fluid class="pt-3 px-8">
    <header class="mb-6">
      <div class="display-1 font-weight-medium">{{ t('tracks.Tracks') }}</div>
    </header>
  </v-container>
</template>
