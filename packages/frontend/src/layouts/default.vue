<script lang="ts">
import logoSVG from '~/assets/logo_colored.svg';
import { useEffectiveTheme } from '~/composables';
import { PREFERENCE_LANGUAGE_OPTIONS } from '~/config';
import { usePreferenceStore } from '~/stores/preference';

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const preferenceStore = usePreferenceStore();
    const { switchTheme$$q, themeName$$q } = useEffectiveTheme();

    const isSignInPage$$q = computedEager(
      () => router.currentRoute.value.path === '/login'
    );
    const isSignUpPage$$q = computedEager(
      () => router.currentRoute.value.path === '/signup'
    );

    const dialogLanguage$$q = ref(false);

    return {
      t,
      logoSVG$$q: logoSVG,
      preferenceStore$$q: preferenceStore,
      themeName$$q,
      switchTheme$$q,
      languageOptions$$q: PREFERENCE_LANGUAGE_OPTIONS,
      isSignInPage$$q,
      isSignUpPage$$q,
      dialogLanguage$$q,
    };
  },
});
</script>

<template>
  <VApp class="h-full" :theme="themeName$$q">
    <VAppBar class="s-offline-mod-mt border-b" density="compact" :border="1">
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
          <div
            v-show="!isSignInPage$$q"
            :class="isSignUpPage$$q ? '' : '<sm:hidden'"
          >
            <VBtn class="whitespace-nowrap" to="/login">
              {{ t('appBar.button.SignIn') }}
            </VBtn>
          </div>
          <div v-show="!isSignUpPage$$q">
            <VBtn class="whitespace-nowrap border" to="/signup">
              {{ t('appBar.button.SignUp') }}
            </VBtn>
          </div>
          <div class="<sm:hidden">
            <NSelect
              v-model:value="preferenceStore$$q.language"
              :options="languageOptions$$q"
              class="max-w-64"
            />
          </div>
          <VDialog v-model="dialogLanguage$$q">
            <template #activator="{ props }">
              <VBtn v-bind="props" icon size="small" class="sm:hidden">
                <i-mdi-translate />
              </VBtn>
            </template>
            <VSheet>
              <div class="text-xl px-4 py-2">Choose language</div>
              <VDivider />
              <VList class="w-80 max-w-full" @contextmenu.prevent>
                <template v-for="item in languageOptions$$q" :key="item.value">
                  <VListItem
                    class="flex gap-x-4 rounded-4px cursor-pointer"
                    active-color="primary"
                    :active="preferenceStore$$q.language === item.value"
                    @click="
                      (preferenceStore$$q.language = item.value),
                        (dialogLanguage$$q = false)
                    "
                  >
                    <VListItemHeader class="flex-1">
                      <VListItemTitle class="s-heading-sl">
                        {{ item.label }}
                      </VListItemTitle>
                    </VListItemHeader>
                  </VListItem>
                </template>
              </VList>
            </VSheet>
          </VDialog>
          <VBtn icon size="small" @click="switchTheme$$q()">
            <i-mdi-invert-colors />
          </VBtn>
        </div>
      </div>
    </VAppBar>
    <VMain class="w-full h-full flex flex-col">
      <RouterView class="px-4" />
    </VMain>
  </VApp>
</template>
