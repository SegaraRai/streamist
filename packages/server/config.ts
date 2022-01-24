import {
  API_ORIGIN_FOR_TRANSCODER,
  SECRET_TRANSCODER_CALLBACK_SECRET,
} from '$/services/env';

// this must be larger than or equal to 5MiB. see
// - https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html
// - https://wasabi-support.zendesk.com/hc/en-us/articles/360033859411-How-do-I-clean-up-my-failed-multipart-uploads-
export const MULTIPART_UPLOAD_MIN_CHUNK_SIZE = 8 * 1024 * 1024; // 8MiB

// 10 sec.
export const RESOURCE_TIMESTAMP_MARGIN = 10 * 1000;

export const TRANSCODER_CALLBACK_API_PATH = '/internal/transcoder/callback';
export const TRANSCODER_CALLBACK_API_ENDPOINT = `${API_ORIGIN_FOR_TRANSCODER}${TRANSCODER_CALLBACK_API_PATH}`;
export const TRANSCODER_CALLBACK_API_TOKEN = `Bearer ${SECRET_TRANSCODER_CALLBACK_SECRET}`;

export const PASSWORD_SALT_LENGTH = 32;
export const PASSWORD_SCRYPT_KEYLEN = 64;
export const PASSWORD_SCRYPT_COST = 16384;
export const PASSWORD_SCRYPT_BLOCK_SIZE = 8;
export const PASSWORD_SCRYPT_PARALLELIZATION = 1;
