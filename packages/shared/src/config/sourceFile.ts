import { CACHE_CONTROL_PRIVATE_IMMUTABLE } from './cacheControl';

export const SOURCE_FILE_CONTENT_ENCODING = 'identity';
export const SOURCE_FILE_CONTENT_TYPE = 'application/octet-stream';
export const SOURCE_FILE_CACHE_CONTROL = CACHE_CONTROL_PRIVATE_IMMUTABLE;

/** in msec. 15 min. */
export const SOURCE_FILE_PRESIGNED_URL_MIN_EXPIRES_IN = 15 * 60 * 1000;
/** in msec. 4h (transfer 800MiB in 500kbps) */
export const SOURCE_FILE_UPLOADABLE_AFTER_CREATE = 4 * 60 * 60 * 1000;
/** in msec. 30min. later */
export const SOURCE_FILE_TREAT_AS_NOT_UPLOADED_AFTER_CREATE =
  SOURCE_FILE_UPLOADABLE_AFTER_CREATE + 30 * 60 * 1000;
/** in msec. 30min. (current max. Lambda execution time is 15 min. and max. GCR execution time is 60 min.) */
export const SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_AFTER_UPLOAD = 30 * 60 * 1000;

export const MIN_SOURCE_FILE_SIZE = 1; // forbid uploading empty files (due to multipart upload)

export const USE_GCR_SIZE_THRESHOLD = 400 * 1024 * 1024; // 400MiB

export const SOURCE_AUDIO_FILE_EXTENSIONS = [
  '.aac',
  '.aiff',
  '.ape',
  '.flac',
  '.m4a',
  '.mp3',
  '.ogg',
  '.opus',
  '.tak',
  '.tta',
  '.wav',
  '.weba',
  '.wma',
  '.wv',
] as const;

export const SOURCE_AUDIO_FILE_EXTENSION_SET: ReadonlySet<string> =
  /* @__PURE__ */ new Set(SOURCE_AUDIO_FILE_EXTENSIONS);

export const SOURCE_IMAGE_FILE_EXTENSIONS = [
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.heif',
  '.jp2',
  '.jpeg',
  '.jpg',
  // '.jxl',
  // '.pdf',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
] as const;

export const SOURCE_IMAGE_FILE_EXTENSION_SET: ReadonlySet<string> =
  /* @__PURE__ */ new Set(SOURCE_IMAGE_FILE_EXTENSIONS);

export const SOURCE_CUE_SHEET_FILE_EXTENSION = '.cue';
