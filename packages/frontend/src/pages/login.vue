<route lang="yaml">
meta:
  authPage: true
</route>

<script lang="ts">
import logoSVG from '~/assets/logo_colored.svg';
import { authenticate } from '~/logic/login';
import { parseRedirectTo } from '~/logic/parseRedirectTo';

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();

    useHead({
      title: t('title.SignIn'),
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
    <VCard class="elevation-4 max-w-xl flex-1">
      <VCardHeader>
        <VCardHeaderText class="flex items-center gap-x-2 text-2xl">
          <img
            :src="logoSVG$$q"
            width="128"
            height="128"
            class="block w-7 h-7 select-none pointer-events-none"
            alt="Streamist Logo"
          />
          <span>{{ t('signIn.title') }}</span>
        </VCardHeaderText>
      </VCardHeader>
      <VCardText>
        <VForm
          class="s-autofill-color flex flex-col gap-y-8"
          style="--s-autofill-bg: #0003; --s-autofill-text: inherit"
        >
          <VTextField
            v-model="username$$q"
            type="text"
            name="username"
            required
            prepend-inner-icon="mdi-account"
            hide-details
            :label="t('signIn.label.Username')"
          />
          <VTextField
            v-model="password$$q"
            type="password"
            name="password"
            required
            prepend-inner-icon="mdi-lock"
            hide-details
            :label="t('signIn.label.Password')"
          />
        </VForm>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn flat text color="transparent" @click="login$$q">
          <span :class="requestInProgress$$q && 'invisible'">
            {{ t('signIn.button.SignIn') }}
          </span>
          <template v-if="requestInProgress$$q">
            <VProgressCircular
              class="absolute left-0 top-0 right-0 bottom-0 m-auto"
              indeterminate
              size="20"
            />
          </template>
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>
