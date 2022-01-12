import { CACHE_CONTROL_PRIVATE_IMMUTABLE } from './cacheControl';
import { getExtension } from './path';
import type { SourceFileType } from './types/db';

export const SOURCE_FILE_CONTENT_ENCODING = 'identity';
export const SOURCE_FILE_CONTENT_TYPE = 'application/octet-stream';
export const SOURCE_FILE_CACHE_CONTROL = CACHE_CONTROL_PRIVATE_IMMUTABLE;
/** in sec. */
export const SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN = 15 * 60;
/** in sec. */
export const SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN_MULTIPART = 4 * 60 * 60;

/** in sec. */
export const SOURCE_FILE_UPLOADABLE_SINCE_CREATE = 24 * 60 * 60; // 1d
/** in sec. */
export const SOURCE_FILE_TREAT_AS_NOT_UPLOADED_SINCE_CREATE =
  SOURCE_FILE_UPLOADABLE_SINCE_CREATE +
  Math.max(
    SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN,
    SOURCE_FILE_PRESIGNED_URL_EXPIRES_IN_MULTIPART
  ) +
  1 * 60 * 60;
export const SOURCE_FILE_TREAT_AS_NOT_TRANSCODED_SINCE_TRANSCODE = 24 * 60 * 60;

export const MIN_SOURCE_FILE_SIZE = 1; // forbid uploading empty files (due to multipart upload)
export const MAX_SOURCE_AUDIO_FILE_SIZE = 500 * 1024 * 1024; // 300MiB (will be increased to 800MiB in the future for paid accounts)
export const MAX_SOURCE_CUE_SHEET_FILE_SIZE = 1 * 1024 * 1024; // 1MiB
export const MAX_SOURCE_IMAGE_FILE_SIZE = 100 * 1024 * 1024; // 100MiB

export const USE_NFS_SIZE_THRESHOLD = 400 * 1024 * 1024; // 400MiB

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

export function getSourceFileType(
  filename: string
): SourceFileType | undefined {
  const extension = getExtension(filename).toLowerCase();

  if (extension === SOURCE_CUE_SHEET_FILE_EXTENSION) {
    return 'cueSheet';
  }

  if (SOURCE_AUDIO_FILE_EXTENSION_SET.has(extension)) {
    return 'audio';
  }

  if (SOURCE_IMAGE_FILE_EXTENSION_SET.has(extension)) {
    return 'image';
  }
}
