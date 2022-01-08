import type { VNode } from 'vue';
import { VIcon } from 'vuetify/lib/components/index';
import { COLOR_CSS_VAR_MAP, ThemeColor } from '../theme';

export function nCreateDropdownIcon(
  icon: string | (() => string),
  props?: Record<string, any> | null
): () => VNode {
  return typeof icon === 'string'
    ? (): VNode => h(VIcon, props, (): string => icon) // wrap in a function to suppress the warning from vue
    : (): VNode => h(VIcon, props, icon);
}

export function nCreateDropdownTextColorStyle(color: ThemeColor): string {
  const colorValue = `var(${COLOR_CSS_VAR_MAP[color]})`;
  return [
    `--n-option-text-color:${colorValue};`,
    `--n-option-text-color-hover:${colorValue};`,
    `--n-prefix-color:${colorValue};`,
  ].join('');
}
