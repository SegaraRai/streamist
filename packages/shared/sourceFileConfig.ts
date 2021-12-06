import { CACHE_CONTROL_PRIVATE_IMMUTABLE } from './cacheControl.js';

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
