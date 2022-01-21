<route lang="yaml">
meta:
  layout: conditional
  requiresAuth: true
</route>

<script lang="ts">
import { useDialog } from 'naive-ui';
import {
  PREFERENCE_AUDIO_QUALITIES,
  PREFERENCE_LANGUAGE_OPTIONS,
} from '~/config';
import { useSyncDB } from '~/db';
import { logout } from '~/logic/logout';
import { usePreferenceStore } from '~/stores/preference';
import { PREFERENCE_THEMES, useThemeStore } from '~/stores/theme';

export default defineComponent({
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const dialog = useDialog();
    const preferenceStore = usePreferenceStore();
    const themeStore = useThemeStore();
    const syncDB = useSyncDB();

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

    const synchronized$$q = ref(false);
    const synchronizeInProgress$$q = ref(false);

    onMounted(() => {
      synchronized$$q.value = false;
      synchronizeInProgress$$q.value = false;
    });

    return {
      t,
      audioQualityOptions$$q,
      languageOptions$$q: PREFERENCE_LANGUAGE_OPTIONS,
      themeOptions$$q,
      preferenceStore$$q: preferenceStore,
      themeStore$$q: themeStore,
      synchronized$$q,
      synchronizeInProgress$$q,
      logout$$q: () => {
        dialog.warning({
          title: t('dialog.signOut.title'),
          content: t('dialog.signOut.content'),
          positiveText: t('dialog.signOut.button.SignOut'),
          negativeText: t('dialog.signOut.button.Cancel'),
          onPositiveClick: () => {
            logout();
            router.push('/login');
          },
        });
      },
      syncDB$$q: (force: boolean): void => {
        synchronizeInProgress$$q.value = true;

        syncDB(force)
          .then(() => {
            synchronized$$q.value = true;
          })
          .finally(() => {
            synchronizeInProgress$$q.value = false;
          });
      },
    };
  },
});
</script>

<template>
  <VContainer fluid class="pt-0">
    <div class="flex flex-col gap-y-4">
      <header class="s-title">
        <h1 class="text-h5">
          {{ t('settings.device.title') }}
        </h1>
      </header>
      <div class="flex flex-col gap-y-8">
        <div class="flex flex-col gap-y-4">
          <h2 class="text-xl">
            {{ t('settings.device.header.Language') }}
          </h2>
          <div class="w-64">
            <!-- TODO: migrate to v-select -->
            <NSelect
              v-model:value="preferenceStore$$q.language"
              :options="languageOptions$$q"
            />
          </div>
        </div>
        <div class="flex flex-col gap-y-4">
          <h2 class="text-xl">
            {{ t('settings.device.header.Theme') }}
          </h2>
          <div class="w-64">
            <!-- TODO: migrate to v-select -->
            <NSelect
              v-model:value="themeStore$$q.rawTheme"
              :options="themeOptions$$q"
            />
          </div>
        </div>
        <div class="flex flex-col gap-y-4">
          <h2 class="text-xl">
            {{ t('settings.device.header.AudioQuality') }}
          </h2>
          <div class="w-64">
            <!-- TODO: migrate to v-select -->
            <NSelect
              v-model:value="preferenceStore$$q.audioQuality"
              :options="audioQualityOptions$$q"
            />
          </div>
        </div>
        <div class="mt-4 flex flex-col gap-y-12">
          <div>
            <VBtn
              color="primary"
              :disabled="synchronized$$q || synchronizeInProgress$$q"
              @click="syncDB$$q(true)"
            >
              <span :class="synchronizeInProgress$$q && 'invisible'">
                {{
                  synchronized$$q
                    ? t('common.Synchronized')
                    : t('common.Synchronize')
                }}
              </span>
              <template v-if="synchronizeInProgress$$q">
                <VProgressCircular
                  class="absolute left-0 top-0 right-0 bottom-0 m-auto"
                  indeterminate
                  size="20"
                />
              </template>
            </VBtn>
          </div>
          <div>
            <VBtn color="error" @click="logout$$q">
              {{ t('common.SignOut') }}
            </VBtn>
          </div>
        </div>
      </div>
      <div class="mt-8">
        <RouterLink
          class="inline-flex items-center gap-x-1 text-st-primary text-lg"
          to="/settings/account"
        >
          {{ t('settings.device.link.AccountSettings') }}
        </RouterLink>
      </div>
    </div>
  </VContainer>
</template>
