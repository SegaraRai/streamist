import {
  SOURCE_AUDIO_FILE_EXTENSION_SET,
  SOURCE_CUE_SHEET_FILE_EXTENSION,
  SOURCE_IMAGE_FILE_EXTENSION_SET,
} from './config';
import { getExtension } from './path';
import type { SourceFileType } from './types';

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
