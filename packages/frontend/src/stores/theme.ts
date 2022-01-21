import { acceptHMRUpdate, defineStore } from 'pinia';
import { THEME_NAMES, ThemeName } from '~/logic/theme';
import { createInSerializer } from './utils';

export type InternalTheme = ThemeName | 'system';

export const PREFERENCE_THEME_DEFAULT: InternalTheme = 'system';
export const PREFERENCE_THEMES: readonly InternalTheme[] = [
  'system',
  ...THEME_NAMES,
];

export const useThemeStore = defineStore('theme', () => {
  const rawTheme = useLocalStorage<InternalTheme>(
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
