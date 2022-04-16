<route lang="yaml">
meta:
  layout: conditional
</route>

<script lang="ts">
import logoSVG from '~/assets/logo_colored.svg';
import { loggedInRef } from '~/stores/auth';

export default defineComponent({
  setup() {
    const { t } = useI18n();

    useHead({
      title: t('title.Home'),
    });

    return {
      t,
      logoSVG$$q: logoSVG,
      loggedIn$$q: loggedInRef,
    };
  },
});
</script>

<template>
  <template v-if="loggedIn$$q">
    <VContainer fluid class="pt-0">
      <SHome />
    </VContainer>
  </template>
  <template v-else>
    <VContainer>
      <div class="flex flex-col text-center items-center pt-16">
        <img
          :src="logoSVG$$q"
          width="128"
          height="128"
          class="block w-32 h-32 select-none pointer-events-none"
          alt="Streamist Logo"
        />
        <div class="s-heading text-4xl mt-8">
          {{ t('landing.title') }}
        </div>
        <div class="text-xl mt-8">
          {{ t('landing.description') }}
        </div>
        <div class="mt-8">
          <VBtn color="primary" to="/signup">
            {{ t('landing.button.SignUp') }}
          </VBtn>
        </div>
      </div>
    </VContainer>
  </template>
</template>
