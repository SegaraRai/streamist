import type { ThemeDefinition } from 'vuetify';
import { THEMES, ThemeName } from './definitions';

export const VUETIFY_THEMES: Record<ThemeName, ThemeDefinition> =
  Object.fromEntries(
    THEMES.map((theme): [ThemeName, ThemeDefinition] => [
      theme.name,
      {
        dark: theme.dark,
        colors: {
          background: theme.background,
          surface: theme.surface,
          'surface-variant': theme.tooltip,
          'on-surface-variant': theme.onTooltip,
          primary: theme.primary,
          secondary: theme.secondary,
          error: theme.error,
          info: theme.info,
          success: theme.success,
          warning: theme.warning,
        },
        variables: {},
      },
    ])
  ) as Record<ThemeName, ThemeDefinition>;
