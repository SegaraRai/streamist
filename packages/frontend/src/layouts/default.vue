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

    const isLoginPage$$q = eagerComputed(
      () => router.currentRoute.value.path === '/login'
    );
    const isRegisterPage$$q = eagerComputed(
      () => router.currentRoute.value.path === '/register'
    );

    return {
      t,
      logoSVG$$q: logoSVG,
      preferenceStore$$q: preferenceStore,
      themeName$$q,
      switchTheme$$q,
      languageOptions$$q: PREFERENCE_LANGUAGE_OPTIONS,
      isLoginPage$$q,
      isRegisterPage$$q,
    };
  },
});
</script>

<template>
  <v-app :theme="themeName$$q">
    <v-app-bar flat :border="1" density="compact" class="s-offline-mod-mt">
      <div class="w-full flex justify-between items-center">
        <div class="ml-0 pl-2 sm:pr-12 hidden-xs-only select-none flex-none">
          <router-link
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
          </router-link>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-x-2">
          <div v-show="!isLoginPage$$q">
            <v-btn class="whitespace-nowrap" to="/login">
              {{ t('appBar.button.Login') }}
            </v-btn>
          </div>
          <div v-show="!isRegisterPage$$q">
            <v-btn class="whitespace-nowrap border" to="/register">
              {{ t('appBar.button.Register') }}
            </v-btn>
          </div>
          <n-select
            v-model:value="preferenceStore$$q.language"
            :options="languageOptions$$q"
            class="max-w-64"
          />
          <v-btn icon size="small" @click="switchTheme$$q()">
            <v-icon>mdi-invert-colors</v-icon>
          </v-btn>
        </div>
      </div>
    </v-app-bar>
    <v-main>
      <router-view class="px-4" />
    </v-main>
  </v-app>
</template>
