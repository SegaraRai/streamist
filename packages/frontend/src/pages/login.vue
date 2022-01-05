<route lang="yaml">
meta:
  layout: login
</route>

<script lang="ts">
import { authenticate } from '~/logic/tokens';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const router = useRouter();

    useHead({
      title: t('title.Login'),
    });

    const username$$q = ref('');
    const password$$q = ref('');

    return {
      t,
      username$$q,
      password$$q,
      login$$q() {
        authenticate(username$$q.value, password$$q.value).then(() => {
          const to = router.currentRoute.value.query.to;
          router.push((typeof to === 'string' ? to : '') || '/');
        });
      },
    };
  },
});
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <v-card class="elevation-4 max-w-xl flex-1">
      <v-card-header>
        <v-card-header-text class="text-2xl">Login</v-card-header-text>
      </v-card-header>
      <v-card-text>
        <v-form
          class="s-autofill-color"
          style="--s-autofill-bg: #0003; --s-autofill-text: inherit"
        >
          <v-text-field
            v-model="username$$q"
            prepend-inner-icon="mdi-account"
            type="text"
            hide-details
          />
          <v-text-field
            v-model="password$$q"
            type="password"
            prepend-inner-icon="mdi-lock"
            hide-details
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn flat text color="transparent" @click="login$$q">Login</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
