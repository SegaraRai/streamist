import { configDevelopment, setOS } from '$shared/objectStorage';

// TODO(prod): change definition
setOS(configDevelopment);

export const IDLE_TIMEOUT = 1 * 60 * 1000;
export const COOKIE_CHECK_INTERVAL = 30 * 1000;

export const SYNC_DB_THROTTLE = 5 * 1000;

export const RESTORE_SCROLL_CHECK_TIMEOUT = 5 * 1000;
export const RESTORE_SCROLL_CHECK_INTERVAL = 100;
export const STORE_SCROLL_THROTTLE = 100;

export const RECENTLY_PLAYED_MAX_ENTRIES = 50;
export const RECENTLY_UPLOADED_MAX_ENTRIES = 50;

export const RECENTLY_SEARCHED_MAX_ENTRIES = 100;
export const RECENTLY_SEARCHED_MAX_ENTRIES_DISPLAY = 5;

export const SEARCH_MAX_ENTRIES_DISPLAY = 50;

export const TOKEN_SHOULD_RENEW_TOLERANCE = -5 * 60;

export const UPLOAD_MANAGER_DB_SYNC_INTERVAL = 20 * 1000;
export const UPLOAD_MANAGER_DB_SYNC_CHECK_INTERVAL = 5 * 1000;
export const UPLOAD_MANAGER_FILE_SYNC_THROTTLE = 100;

export const SEARCH_DEBOUNCE_INTERVAL = 100;
export const SEARCH_DEBOUNCE_MAX_WAIT = 500;

export const LOSSLESS_AUDIO_FILE_EXTENSION_SET: ReadonlySet<string> =
  /* @__PURE__ */ new Set([
    '.aiff',
    '.ape',
    '.flac',
    '.m4a', // ALAC, in case
    '.tak',
    '.tta',
    '.wav',
    '.wma', // WMA Lossless, in case
    '.wv',
  ]);

export const CDN_ENDPOINT = import.meta.env.VITE_CDN_ORIGIN;

//

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

export const PREFERENCE_AUDIO_QUALITIES = ['medium', 'veryHigh'];

export type AudioQuality = typeof PREFERENCE_AUDIO_QUALITIES[number];

export const PREFERENCE_AUDIO_QUALITY_DEFAULT: AudioQuality = 'medium';

//

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
