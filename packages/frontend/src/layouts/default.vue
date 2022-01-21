<script lang="ts">
import logoSVG from '~/assets/logo_colored.svg';
import { useEffectiveTheme } from '~/composables/useEffectiveTheme';
import { PREFERENCE_LANGUAGE_OPTIONS } from '~/config';
import { usePreferenceStore } from '~/stores/preference';

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const preferenceStore = usePreferenceStore();
    const { switchTheme$$q, themeName$$q } = useEffectiveTheme();

    const isSignInPage$$q = eagerComputed(
      () => router.currentRoute.value.path === '/login'
    );
    const isSignUpPage$$q = eagerComputed(
      () => router.currentRoute.value.path === '/signup'
    );

    return {
      t,
      logoSVG$$q: logoSVG,
      preferenceStore$$q: preferenceStore,
      themeName$$q,
      switchTheme$$q,
      languageOptions$$q: PREFERENCE_LANGUAGE_OPTIONS,
      isSignInPage$$q,
      isSignUpPage$$q,
    };
  },
});
</script>

<template>
  <VApp :theme="themeName$$q">
    <VAppBar flat :border="1" density="compact" class="s-offline-mod-mt">
      <div class="w-full flex justify-between items-center">
        <div class="ml-0 pl-2 sm:pr-12 hidden-xs-only select-none flex-none">
          <RouterLink
            to="/"
            class="flex items-center gap-x-1"
            aria-label="Streamist Logo"
          >
            <img
              :src="logoSVG$$q"
              width="128"
              height="128"
              class="block w-7 h-7 select-none pointer-events-none"
              alt="Streamist Logo"
            />
            <span class="inline-block <sm:hidden" aria-hidden="true">
              <span class="text-xl leading-none">streamist</span>
              <span class="text-sm leading-none">.app</span>
            </span>
          </RouterLink>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-x-2">
          <div v-show="!isSignInPage$$q">
            <VBtn class="whitespace-nowrap" to="/login">
              {{ t('appBar.button.SignIn') }}
            </VBtn>
          </div>
          <div v-show="!isSignUpPage$$q">
            <VBtn class="whitespace-nowrap border" to="/signup">
              {{ t('appBar.button.SignUp') }}
            </VBtn>
          </div>
          <NSelect
            v-model:value="preferenceStore$$q.language"
            :options="languageOptions$$q"
            class="max-w-64"
          />
          <VBtn icon size="small" @click="switchTheme$$q()">
            <VIcon>mdi-invert-colors</VIcon>
          </VBtn>
        </div>
      </div>
    </VAppBar>
    <VMain>
      <RouterView class="px-4" />
    </VMain>
  </VApp>
</template>
