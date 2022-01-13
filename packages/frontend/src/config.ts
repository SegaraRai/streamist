export const IDLE_TIMEOUT = 1 * 60 * 1000;
export const COOKIE_CHECK_INTERVAL = 30 * 1000;

export const RESTORE_SCROLL_CHECK_TIMEOUT = 5000;
export const RESTORE_SCROLL_CHECK_INTERVAL = 100;

export const RECENTLY_PLAYED_MAX_ENTRIES = 50;
export const RECENTLY_UPLOADED_MAX_ENTRIES = 50;

export const TOKEN_SHOULD_RENEW_TOLERANCE = -5 * 60;

export const UPLOAD_MANAGER_DB_SYNC_INTERVAL = 20 * 1000;

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
