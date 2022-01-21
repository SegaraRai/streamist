<route lang="yaml">
meta:
  layout: auth
</route>

<script lang="ts">
import logoSVG from '~/assets/logo_colored.svg';
import { authenticate } from '~/logic/login';
import { parseRedirectTo } from '~/logic/parseRedirectTo';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const router = useRouter();

    useHead({
      title: t('title.Login'),
    });

    const requestInProgress$$q = ref(false);

    const username$$q = ref('');
    const password$$q = ref('');

    return {
      t,
      logoSVG$$q: logoSVG,
      requestInProgress$$q,
      username$$q,
      password$$q,
      login$$q() {
        if (requestInProgress$$q.value) {
          return;
        }

        requestInProgress$$q.value = true;
        authenticate(username$$q.value, password$$q.value)
          .then(() => {
            router.push(parseRedirectTo(router.currentRoute.value.query.to));
          })
          .finally(() => {
            requestInProgress$$q.value = false;
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
        <v-card-header-text class="flex items-center gap-x-2 text-2xl">
          <img
            :src="logoSVG$$q"
            width="128"
            height="128"
            class="block w-7 h-7 pointer-events-none select-none"
            alt="Streamist Logo"
          />
          <span>{{ t('login.title') }}</span>
        </v-card-header-text>
      </v-card-header>
      <v-card-text>
        <v-form
          class="s-autofill-color flex flex-col gap-y-8"
          style="--s-autofill-bg: #0003; --s-autofill-text: inherit"
        >
          <v-text-field
            v-model="username$$q"
            class="s-v-input-hide-details"
            type="text"
            name="username"
            required
            prepend-inner-icon="mdi-account"
            hide-details
            :label="t('login.label.Username')"
          />
          <v-text-field
            v-model="password$$q"
            class="s-v-input-hide-details"
            type="password"
            name="password"
            required
            prepend-inner-icon="mdi-lock"
            hide-details
            :label="t('login.label.Password')"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn flat text color="transparent" @click="login$$q">
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('login.button.Login') }}
          </span>
          <template v-if="requestInProgress$$q">
            <v-progress-circular
              class="absolute left-0 top-0 right-0 bottom-0 m-auto"
              indeterminate
              size="20"
            />
          </template>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
