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
}

const THEME_DARK: ThemeDefinitionColor = {
  name: 'dark',
  dark: true,
  background: '#101010',
  surface: '#1b1b1c',
  tooltip: '#343437',
  onTooltip: '#ffffff',
  text: '#ffffff',
  primary: '#4a8af2',
  secondary: '#4a8af2',
  error: '#f2444a',
  info: '#1f94ed',
  success: '#4bad4e',
  warning: '#f28a0a',
};

// TODO
const THEME_LIGHT: ThemeDefinitionColor = {
  ...THEME_DARK,
  name: 'light',
  dark: false,
};

export const THEME_KEYS = Object.keys(THEME_DARK) as readonly ThemeName[];

export const THEMES: readonly ThemeDefinitionColor[] = [
  THEME_DARK,
  THEME_LIGHT,
];

export function toKebabCase(str: string): string {
  return str
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/^-+/, '');
}

export type ThemeColor = Exclude<keyof ThemeDefinitionColor, 'dark' | 'name'>;

export const COLOR_KEYS = Object.keys(THEME_DARK).filter(
  (key) => key !== 'dark' && key !== 'name'
) as readonly ThemeColor[];

export const COLOR_CSS_VAR_MAP = /* @__PURE__ */ Object.fromEntries(
  COLOR_KEYS.map((key) => [key, `--s-theme-${toKebabCase(key)}`])
) as Readonly<Record<ThemeColor, string>>;
