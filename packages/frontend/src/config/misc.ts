export const IDLE_TIMEOUT = 1 * 60 * 1000;
export const COOKIE_CHECK_INTERVAL = 30 * 1000;

export const SW_UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

export const SYNC_DB_THROTTLE = 5 * 1000;

// this is required to prevent dancing with multiple tab opened (see issue #117)
export const VOLUME_SYNC_THROTTLE = 100;

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
