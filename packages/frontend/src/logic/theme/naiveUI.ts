import type { GlobalTheme, GlobalThemeOverrides } from 'naive-ui';
import { darkTheme } from 'naive-ui/lib/themes/dark';
import { lightTheme } from 'naive-ui/lib/themes/light';
import { THEMES, ThemeName } from './definitions';

export interface NaiveUITheme {
  readonly name: ThemeName;
  readonly base: GlobalTheme;
  readonly overrides: GlobalThemeOverrides;
}

const NAIVE_UI_BASE_THEMES = {
  dark: darkTheme,
  light: lightTheme,
} as const;

export const NAIVE_UI_THEMES: Record<ThemeName, NaiveUITheme> =
  Object.fromEntries(
    THEMES.map((theme): [ThemeName, NaiveUITheme] => [
      theme.name,
      {
        name: theme.name,
        base: NAIVE_UI_BASE_THEMES[theme.name],
        overrides: {
          common: {
            baseColor: theme.background,
            primaryColor: theme.primary,
            // primaryColorHover: string,
            // primaryColorPressed: string,
            // primaryColorSuppl: string,
            infoColor: theme.info,
            // infoColorHover: string,
            // infoColorPressed: string,
            // infoColorSuppl: string,
            successColor: theme.success,
            // successColorHover: string,
            // successColorPressed: string,
            // successColorSuppl: string,
            warningColor: theme.warning,
            // warningColorHover: string,
            // warningColorPressed: string,
            // warningColorSuppl: string,
            errorColor: theme.error,
            // errorColorHover: string,
            // errorColorPressed: string,
            // errorColorSuppl: string,
            textColorBase: theme.text,
            // textColorDisabled: string,
            // placeholderColor: string,
            // placeholderColorDisabled: string,
            // dividerColor: string,
            // borderColor: string,
            closeColor: theme.error,
            // closeColorHover: string,
            // closeColorPressed: string,
            // closeColorDisabled: string,
            popoverColor: theme.tooltip,
          },
        },
      },
    ])
  ) as Record<ThemeName, NaiveUITheme>;

export function createOverrideTheme(
  base: Exclude<GlobalThemeOverrides, undefined>,
  key: 'primary' | 'info' | 'success' | 'warning' | 'error'
) {
  const baseColor = base.common![`${key}Color`];
  const baseColorHover = base.common![`${key}ColorHover`];
  const baseColorPressed = base.common![`${key}ColorPressed`];
  const baseColorSuppl = base.common![`${key}ColorSuppl`];
  return {
    common: {
      primaryColor: baseColor,
      primaryColorHover: baseColorHover,
      primaryColorPressed: baseColorPressed,
      primaryColorSuppl: baseColorSuppl,
      infoColor: baseColor,
      infoColorHover: baseColorHover,
      infoColorPressed: baseColorPressed,
      infoColorSuppl: baseColorSuppl,
      successColor: baseColor,
      successColorHover: baseColorHover,
      successColorPressed: baseColorPressed,
      successColorSuppl: baseColorSuppl,
      warningColor: baseColor,
      warningColorHover: baseColorHover,
      warningColorPressed: baseColorPressed,
      warningColorSuppl: baseColorSuppl,
      errorColor: baseColor,
      errorColorHover: baseColorHover,
      errorColorPressed: baseColorPressed,
      errorColorSuppl: baseColorSuppl,
    },
  };
}
