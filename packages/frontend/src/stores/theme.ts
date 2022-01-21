import { acceptHMRUpdate, defineStore } from 'pinia';
import {
  PREFERENCE_THEMES,
  PREFERENCE_THEME_DEFAULT,
  PreferenceThemeName,
} from '~/config';
import { createInSerializer } from './utils';

export const useThemeStore = defineStore('theme', () => {
  const rawTheme = useLocalStorage<PreferenceThemeName>(
    'preference.theme',
    PREFERENCE_THEME_DEFAULT,
    {
      serializer: createInSerializer(
        PREFERENCE_THEMES,
        PREFERENCE_THEME_DEFAULT
      ),
    }
  );

  return {
    rawTheme,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useThemeStore, import.meta.hot));
}
