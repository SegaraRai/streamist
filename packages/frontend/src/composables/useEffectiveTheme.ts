import { storeToRefs } from 'pinia';
import { THEMES, ThemeName } from '~/logic/theme';
import { PREFERENCE_THEME_DEFAULT, useThemeStore } from '~/stores/theme';

const THEME_NO_PREFERENCE: ThemeName = 'light';

const COLOR_SCHEMA_TO_THEME_NAME = {
  dark: 'dark',
  light: 'light',
  'no-preference': THEME_NO_PREFERENCE,
} as const;

function _useEffectiveTheme() {
  const { rawTheme } = storeToRefs(useThemeStore());
  const colorSchema = usePreferredColorScheme();

  const rootElement = document.documentElement;

  const effectiveThemeName = ref<ThemeName>(
    (rootElement.dataset.sTheme || PREFERENCE_THEME_DEFAULT) as ThemeName
  );

  const mounted = useMounted();
  watch([colorSchema, rawTheme], ([newColorSchema, newRawTheme]): void => {
    if (!mounted.value) {
      return;
    }

    effectiveThemeName.value =
      newRawTheme === 'system'
        ? COLOR_SCHEMA_TO_THEME_NAME[newColorSchema]
        : newRawTheme;
  });

  const dark = eagerComputed(
    (): boolean => THEMES[effectiveThemeName.value].dark
  );

  return {
    themeName$$q: effectiveThemeName,
    isDarkTheme$$q: dark,
    switchTheme$$q: (): void => {
      rawTheme.value = effectiveThemeName.value === 'light' ? 'dark' : 'light';
    },
  };
}

export const useEffectiveTheme = createSharedComposable(_useEffectiveTheme);
