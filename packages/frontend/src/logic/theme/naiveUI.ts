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

function blend(x: string, y: string, alpha: number): string {
  const xr = parseInt(x.slice(1, 3), 16);
  const xg = parseInt(x.slice(3, 5), 16);
  const xb = parseInt(x.slice(5, 7), 16);
  const yr = parseInt(y.slice(1, 3), 16);
  const yg = parseInt(y.slice(3, 5), 16);
  const yb = parseInt(y.slice(5, 7), 16);
  const revAlpha = 1 - alpha;
  const r = Math.round(xr * revAlpha + yr * alpha);
  const g = Math.round(xg * revAlpha + yg * alpha);
  const b = Math.round(xb * revAlpha + yb * alpha);
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function createHover(color: string, _dark: boolean): string {
  return blend(color, '#FFFFFF', 0.2);
}

function createPressed(color: string, _dark: boolean): string {
  return blend(color, '#000000', 0.2);
}

function createSuppl(color: string, _dark: boolean): string {
  return blend(color, '#000000', 0.4);
}

function createDisabled(color: string, _dark: boolean): string {
  return blend(color, '#FFFFFF', 0.4);
}

export const NAIVE_UI_THEMES: Record<ThemeName, NaiveUITheme> =
  Object.fromEntries(
    Object.values(THEMES).map((theme): [ThemeName, NaiveUITheme] => [
      theme.name,
      {
        name: theme.name,
        base: NAIVE_UI_BASE_THEMES[theme.name],
        overrides: {
          common: {
            baseColor: theme.background,
            primaryColor: theme.primary,
            primaryColorHover: createHover(theme.primary, theme.dark),
            primaryColorPressed: createPressed(theme.primary, theme.dark),
            primaryColorSuppl: createSuppl(theme.primary, theme.dark),
            infoColor: theme.info,
            infoColorHover: createHover(theme.info, theme.dark),
            infoColorPressed: createPressed(theme.info, theme.dark),
            infoColorSuppl: createSuppl(theme.info, theme.dark),
            successColor: theme.success,
            successColorHover: createHover(theme.success, theme.dark),
            successColorPressed: createPressed(theme.success, theme.dark),
            successColorSuppl: createSuppl(theme.success, theme.dark),
            warningColor: theme.warning,
            warningColorHover: createHover(theme.warning, theme.dark),
            warningColorPressed: createPressed(theme.warning, theme.dark),
            warningColorSuppl: createSuppl(theme.warning, theme.dark),
            errorColor: theme.error,
            errorColorHover: createHover(theme.error, theme.dark),
            errorColorPressed: createPressed(theme.error, theme.dark),
            errorColorSuppl: createSuppl(theme.error, theme.dark),
            textColorBase: theme.text,
            // textColorDisabled: string,
            // placeholderColor: string,
            // placeholderColorDisabled: string,
            // dividerColor: string,
            // borderColor: string,
            closeColor: theme.error,
            closeColorHover: createHover(theme.error, theme.dark),
            closeColorPressed: createPressed(theme.error, theme.dark),
            closeColorDisabled: createDisabled(theme.error, theme.dark),
            popoverColor: theme.tooltip,
          },
          Dropdown: {
            optionHeightMedium: '36px',
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
