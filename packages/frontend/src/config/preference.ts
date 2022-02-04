import { THEME_NAMES, ThemeName } from './theme';

export const PREFERENCE_LANGUAGES = [
  ['en', 'English (English)'],
  ['ja', 'Japanese (日本語)'],
] as const;

export const PREFERENCE_LANGUAGE_CODES = PREFERENCE_LANGUAGES.map(
  ([code]) => code
);

export type LanguageCode = typeof PREFERENCE_LANGUAGE_CODES[number];

export const PREFERENCE_LANGUAGE_CODE_DEFAULT: LanguageCode = 'en';
export const PREFERENCE_LANGUAGE_CODE_FALLBACK: LanguageCode = 'en';

export const PREFERENCE_LANGUAGE_OPTIONS = PREFERENCE_LANGUAGES.map(
  ([code, name]) => ({
    value: code,
    label: name,
  })
);

//

export type PreferenceThemeName = ThemeName | 'system';

export const PREFERENCE_THEME_DEFAULT: PreferenceThemeName = 'system';
export const PREFERENCE_THEMES: readonly PreferenceThemeName[] = [
  'system',
  ...THEME_NAMES,
];

//

export const PREFERENCE_AUDIO_QUALITIES = ['medium', 'veryHigh'];

export type AudioQuality = typeof PREFERENCE_AUDIO_QUALITIES[number];

export const PREFERENCE_AUDIO_QUALITY_DEFAULT: AudioQuality = 'medium';

export const AUDIO_SCORE_BASE = 100;

export const AUDIO_SCORE_BY_EXTENSION: Record<string, number> = {
  '.weba': 200,
  '.m4a': 100,
};

export const AUDIO_SCORE_BY_FORMAT_PER_PREFERENCE: Record<
  AudioQuality,
  Record<string, number>
> = {
  medium: {
    'v1-aac-96k': 2000,
    'v1-opus-96k': 2000,
    'v1-aac-256k': 1000,
    'v1-opus-256k': 1000,
  },
  veryHigh: {
    'v1-aac-96k': 1000,
    'v1-opus-96k': 1000,
    'v1-aac-256k': 2000,
    'v1-opus-256k': 2000,
  },
};

//

export const PREFERENCE_CONFIRM_ON_LEAVES = ['always', 'whenPlaying', 'never'];
export type ConfirmOnLeave = typeof PREFERENCE_CONFIRM_ON_LEAVES[number];
export const PREFERENCE_CONFIRM_ON_LEAVE_DEFAULT: ConfirmOnLeave = 'never';

//

export const PREFERENCE_PWA_PREVENT_CLOSE_DEFAULT = true;
