import type { ThemeDefinition } from 'vuetify';
import { THEMES, ThemeName } from '~/config';

export const VUETIFY_THEMES: Record<ThemeName, ThemeDefinition> =
  Object.fromEntries(
    Object.values(THEMES).map((theme): [ThemeName, ThemeDefinition] => [
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
          'on-background': theme.text,
          'on-error': theme.onError || theme.text,
          'on-info': theme.onInfo || theme.text,
          'on-primary': theme.onPrimary || theme.text,
          'on-secondary': theme.onSecondary || theme.text,
          'on-success': theme.onSuccess || theme.text,
          'on-warning': theme.onWarning || theme.text,
          'on-surface': theme.text,
        },
        variables: {},
      },
    ])
  ) as Record<ThemeName, ThemeDefinition>;
