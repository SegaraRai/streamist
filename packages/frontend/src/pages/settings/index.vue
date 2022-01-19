<route lang="yaml">
meta:
  layout: app
</route>

<script lang="ts">
import { PREFERENCE_AUDIO_QUALITIES, PREFERENCE_LANGUAGES } from '~/config';
import { usePreferenceStore } from '~/stores/preference';
import { PREFERENCE_THEMES, useThemeStore } from '~/stores/theme';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    const preferenceStore = usePreferenceStore();
    const themeStore = useThemeStore();

    const languageOptions$$q = PREFERENCE_LANGUAGES.map(([code, name]) => ({
      value: code,
      label: name,
    }));

    const themeOptions$$q = eagerComputed(() =>
      PREFERENCE_THEMES.map((code) => ({
        value: code,
        label: t(`settings.theme.${code}`),
      }))
    );

    const audioQualityOptions$$q = eagerComputed(() =>
      PREFERENCE_AUDIO_QUALITIES.map((code) => ({
        value: code,
        label: t(`settings.audioQuality.${code}`),
      }))
    );

    return {
      audioQualityOptions$$q,
      languageOptions$$q,
      themeOptions$$q,
      preferenceStore$$q: preferenceStore,
      themeStore$$q: themeStore,
    };
  },
});
</script>

<template>
  <v-container fluid class="pt-0">
    <div class="flex flex-col gap-y-16">
      <div class="flex flex-col gap-y-4">
        <header class="s-title">
          <h1 class="text-h5">Device Settings</h1>
        </header>
        <div class="flex flex-col gap-y-8">
          <div class="flex flex-col gap-y-4">
            <h2 class="text-xl">Language</h2>
            <div class="w-64">
              <n-select
                v-model:value="preferenceStore$$q.language"
                :options="languageOptions$$q"
              />
            </div>
          </div>
          <div class="flex flex-col gap-y-4">
            <h2 class="text-xl">Theme</h2>
            <div class="w-64">
              <n-select
                v-model:value="themeStore$$q.rawTheme"
                :options="themeOptions$$q"
              />
            </div>
          </div>
          <div class="flex flex-col gap-y-4">
            <h2 class="text-xl">Audio quality</h2>
            <div class="w-64">
              <n-select
                v-model:value="preferenceStore$$q.audioQuality"
                :options="audioQualityOptions$$q"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- div class="flex flex-col gap-y-4">
        <header class="s-title">
          <h1 class="text-h5">Account Settings</h1>
        </header>
        <div class="flex flex-col gap-y-8">
          <div class="flex flex-col gap-y-4">
            <h2 class="text-xl">Display Name</h2>
            <div class="w-64">
              <n-input type="text" placeholder="Display Name" class="w-full" />
            </div>
          </div>
        </div>
      </div -->
    </div>
  </v-container>
</template>
