export type ThemeName = 'dark' | 'light';

export interface ThemeDefinitionColor {
  readonly name: ThemeName;
  readonly dark: boolean;
  readonly background: string;
  /** for headers, footers, sidebars */
  readonly surface: string;
  readonly tooltip: string;
  readonly onTooltip: string;
  readonly text: string;
  readonly primary: string;
  /** idk */
  readonly secondary: string;
  readonly error: string;
  readonly info: string;
  readonly success: string;
  readonly warning: string;
  readonly onPrimary: string;
  readonly onSecondary: string;
  readonly onError: string;
  readonly onInfo: string;
  readonly onSuccess: string;
  readonly onWarning: string;
}

export const THEMES: Readonly<Record<ThemeName, ThemeDefinitionColor>> = {
  dark: {
    name: 'dark',
    dark: true,
    background: '#101011',
    surface: '#101011',
    tooltip: '#252528',
    onTooltip: '#f9f9fc',
    text: '#f9f9fc',
    primary: '#2b78fa',
    secondary: '#2b78fa',
    error: '#f2444a',
    info: '#1f94ed',
    success: '#4bad4e',
    warning: '#f28a0a',
    onPrimary: '',
    onSecondary: '',
    onError: '',
    onWarning: '',
    onInfo: '',
    onSuccess: '',
  },
  light: {
    name: 'light',
    dark: false,
    background: '#fdfdfe',
    surface: '#fdfdfe',
    tooltip: '#f7f7f9',
    onTooltip: '#040409',
    text: '#121215',
    primary: '#3187fe',
    secondary: '#3187fe',
    error: '#fe5359',
    info: '#3fadfe',
    success: '#4bad4e',
    warning: '#fea236',
    onPrimary: '#fdfdfe',
    onSecondary: '#fdfdfe',
    onError: '#fdfdfe',
    onWarning: '#fdfdfe',
    onInfo: '#fdfdfe',
    onSuccess: '#fdfdfe',
  },
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

export const THEME_KEYS = Object.keys(
  THEMES.dark
) as readonly (keyof ThemeDefinitionColor)[];

export function toKebabCase(str: string): string {
  return str
    .replace(/[A-Z]/g, (match): string => `-${match.toLowerCase()}`)
    .replace(/^-+/, '');
}

export type ThemeColor = Exclude<keyof ThemeDefinitionColor, 'dark' | 'name'>;

export const COLOR_KEYS = THEME_KEYS.filter(
  (key) => key !== 'dark' && key !== 'name'
) as readonly ThemeColor[];

export const COLOR_CSS_VAR_MAP = /* @__PURE__ */ Object.fromEntries(
  COLOR_KEYS.map((key) => [key, `--s-theme-${toKebabCase(key)}`])
) as Readonly<Record<ThemeColor, string>>;
