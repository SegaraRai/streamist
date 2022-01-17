import { acceptHMRUpdate, defineStore } from 'pinia';
import type { Ref } from 'vue';
import {
  AudioQuality,
  LanguageCode,
  PREFERENCE_AUDIO_QUALITIES,
  PREFERENCE_AUDIO_QUALITY_DEFAULT,
  PREFERENCE_LANGUAGES,
  PREFERENCE_LANGUAGE_CODE_DEFAULT,
} from '~/config';
import { createInSerializer } from './utils';

export const usePreferenceStore = defineStore('preference', () => {
  const { locale } = useI18n();

  const audioQuality = useLocalStorage<AudioQuality>(
    'preference.audioQuality',
    PREFERENCE_AUDIO_QUALITY_DEFAULT,
    {
      serializer: createInSerializer(
        PREFERENCE_AUDIO_QUALITIES,
        PREFERENCE_AUDIO_QUALITY_DEFAULT
      ),
    }
  );

  const language = useLocalStorage<LanguageCode>(
    'preference.language',
    PREFERENCE_LANGUAGE_CODE_DEFAULT,
    {
      serializer: createInSerializer(
        PREFERENCE_LANGUAGES.map(([code]) => code),
        PREFERENCE_LANGUAGE_CODE_DEFAULT
      ),
    }
  );

  biSyncRef<Ref<string>>(language, locale);

  return {
    audioQuality,
    language,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePreferenceStore, import.meta.hot));
}
