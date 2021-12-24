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
    <v-card class="elevation-12 max-w-xl flex-1">
      <v-card-header>
        <v-card-header-text class="text-2xl">Login</v-card-header-text>
      </v-card-header>
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="username$$q"
            prepend-icon="person"
            name="login"
            label="Login"
            type="text"
          />
          <v-text-field
            id="password"
            v-model="password$$q"
            prepend-icon="lock"
            name="password"
            label="Password"
            type="password"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="login$$q">Login</v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
