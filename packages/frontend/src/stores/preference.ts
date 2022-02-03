import { acceptHMRUpdate, defineStore } from 'pinia';
import {
  AudioQuality,
  ConfirmOnLeave,
  LanguageCode,
  PREFERENCE_AUDIO_QUALITIES,
  PREFERENCE_AUDIO_QUALITY_DEFAULT,
  PREFERENCE_CONFIRM_ON_LEAVES,
  PREFERENCE_CONFIRM_ON_LEAVE_DEFAULT,
  PREFERENCE_LANGUAGE_CODES,
} from '~/config';
import { getLanguageFromNavigator } from '~/logic/language';
import { createInSerializer } from './utils';

export const usePreferenceStore = defineStore('preference', () => {
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
    getLanguageFromNavigator(),
    {
      serializer: createInSerializer(
        PREFERENCE_LANGUAGE_CODES,
        getLanguageFromNavigator()
      ),
    }
  );

  const confirmOnLeave = useLocalStorage<ConfirmOnLeave>(
    'preference.confirmOnLeave',
    PREFERENCE_CONFIRM_ON_LEAVE_DEFAULT,
    {
      serializer: createInSerializer(
        PREFERENCE_CONFIRM_ON_LEAVES,
        PREFERENCE_CONFIRM_ON_LEAVE_DEFAULT
      ),
    }
  );

  return {
    audioQuality,
    language,
    confirmOnLeave,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePreferenceStore, import.meta.hot));
}
