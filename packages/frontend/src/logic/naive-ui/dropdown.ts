import type { VNode } from 'vue';
import type { ThemeDefinition, useTheme } from 'vuetify';
import { VIcon } from 'vuetify/lib/components/index';

type ThemeInstance = ReturnType<typeof useTheme>;

export function nCreateDropdownIcon(
  icon: string | (() => string)
): () => VNode {
  return typeof icon === 'string'
    ? (): VNode => h(VIcon, null, (): string => icon) // wrap in a function to suppress the warning from vue
    : (): VNode => h(VIcon, null, icon);
}

export function nCreateDropdownTextColorStyle(
  theme: ThemeInstance,
  color: keyof ThemeDefinition['colors']
): string {
  const colorValue = theme.getTheme(theme.current.value).colors[color];
  return [
    `--option-text-color:${colorValue};`,
    `--option-text-color-hover:${colorValue};`,
    `--prefix-color:${colorValue};`,
    `--n-option-text-color:${colorValue};`,
    `--n-option-text-color-hover:${colorValue};`,
    `--n-prefix-color:${colorValue};`,
  ].join('');
}
