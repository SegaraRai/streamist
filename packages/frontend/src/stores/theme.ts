import { acceptHMRUpdate, defineStore } from 'pinia';
import { THEMES, THEME_NAMES, ThemeName } from '~/logic/theme';
import { createInSerializer } from './utils';

export type InternalTheme = ThemeName | 'system';

export const PREFERENCE_THEME_DEFAULT: InternalTheme = 'system';
export const PREFERENCE_THEMES: readonly InternalTheme[] = [
  'system',
  ...THEME_NAMES,
];

const THEME_NO_PREFERENCE: ThemeName = 'light';

const COLOR_SCHEMA_TO_THEME_NAME = {
  dark: 'dark',
  light: 'light',
  'no-preference': THEME_NO_PREFERENCE,
} as const;

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

  const colorSchema = usePreferredColorScheme();

  const theme = computed<ThemeName>({
    get: (): ThemeName =>
      rawTheme.value === 'system'
        ? COLOR_SCHEMA_TO_THEME_NAME[colorSchema.value]
        : rawTheme.value,
    set: (theme: ThemeName) => {
      rawTheme.value = theme;
    },
  });

  watch(
    theme,
    (newTheme): void => {
      const isDark = THEMES[newTheme].dark;
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      for (const themeName of THEME_NAMES) {
        document.documentElement.classList.toggle(
          `s-theme--${themeName}`,
          themeName === newTheme
        );
      }
    },
    {
      immediate: true,
    }
  );

  return {
    rawTheme,
    theme,
    bgClass: eagerComputed(() =>
      theme.value === 'dark' ? 'white' : 'gray darken-4'
    ),
    headerTheme: theme,
    leftSidebarTheme: theme,
    rightSidebarTheme: theme,
    contentTheme: theme,
    footerTheme: theme,
    dialogTheme: theme,
    toggle: () => {
      theme.value = theme.value === 'light' ? 'dark' : 'light';
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useThemeStore, import.meta.hot));
}
