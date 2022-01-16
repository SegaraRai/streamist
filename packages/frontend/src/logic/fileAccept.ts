import {
  SOURCE_AUDIO_FILE_EXTENSIONS,
  SOURCE_CUE_SHEET_FILE_EXTENSION,
  SOURCE_IMAGE_FILE_EXTENSIONS,
} from '$shared/config';

export const FILE_ACCEPT_IMAGE = [
  'image/*',
  ...SOURCE_IMAGE_FILE_EXTENSIONS,
].join();

export const FILE_ACCEPT_AUDIO = [
  'audio/*',
  SOURCE_CUE_SHEET_FILE_EXTENSION,
  ...SOURCE_AUDIO_FILE_EXTENSIONS,
].join();
