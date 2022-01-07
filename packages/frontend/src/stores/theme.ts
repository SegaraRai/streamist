import { acceptHMRUpdate, defineStore } from 'pinia';
import type { ThemeName } from '~/logic/theme';

export type InternalTheme = ThemeName | 'auto';

const defaultTheme: InternalTheme = 'auto';
const noPreferenceTheme: ThemeName = 'light';

const COLOR_SCHEMA_TO_THEME_NAME = {
  dark: 'dark',
  light: 'light',
  'no-preference': noPreferenceTheme,
} as const;

export const useThemeStore = defineStore('theme', () => {
  const rawTheme = useLocalStorage<InternalTheme>('theme', defaultTheme);
  const colorSchema = usePreferredColorScheme();
  const theme = computed<ThemeName>({
    get: (): ThemeName =>
      rawTheme.value === 'auto'
        ? COLOR_SCHEMA_TO_THEME_NAME[colorSchema.value]
        : rawTheme.value,
    set: (theme: ThemeName) => {
      rawTheme.value = theme;
    },
  });
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
