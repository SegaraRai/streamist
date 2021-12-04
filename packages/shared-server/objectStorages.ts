import type { Region } from '$shared/regions.js';
import type { ObjectStorage } from './objectStorage.js';

const developmentOSMap: ReadonlyMap<Region, ObjectStorage> = new Map<
  Region,
  ObjectStorage
>([
  [
    'ap-northeast-1',
    {
      provider: 'wasabi',
      region: 'ap-northeast-1',
      bucket: 'development-wasabi-ap-northeast-1.stst.page',
    },
  ],
]);

const sourceFileOSMap: ReadonlyMap<Region, ObjectStorage> = developmentOSMap;
const transcodedAudioFileOSMap: ReadonlyMap<Region, ObjectStorage> =
  developmentOSMap;
const transcodedImageFileOSMap: ReadonlyMap<Region, ObjectStorage> =
  developmentOSMap;

const transcodeLogFileOS: ObjectStorage = {
  provider: 'wasabi',
  region: 'ap-northeast-1',
  bucket: 'development-wasabi-ap-northeast-1.stst.page',
};

export function getSourceFileOS(region: Region): ObjectStorage {
  return sourceFileOSMap.get(region)!;
}

export function getTranscodedAudioFileOS(region: Region): ObjectStorage {
  return transcodedAudioFileOSMap.get(region)!;
}

export function getTranscodedImageFileOS(region: Region): ObjectStorage {
  return transcodedImageFileOSMap.get(region)!;
}

export function getTranscodeLogFileOS(): ObjectStorage {
  return transcodeLogFileOS;
}

export function getSourceFileKey(userId: string, fileId: string): string {
  return `src/${userId}/${fileId}`;
}

export function getTranscodedAudioFileKey(
  userId: string,
  fileId: string,
  extension: string
): string {
  return `tra/${userId}/${fileId}${extension}`;
}

export function getTranscodedImageFileKey(
  userId: string,
  fileId: string,
  extension: string
): string {
  return `tri/${userId}/${fileId}${extension}`;
}

export function getTranscodeLogFileKey(
  userId: string,
  sourceFileId: string,
  type: string,
  extension = '.json'
): string {
  return `trx/${userId}/${sourceFileId}/${type}${extension}`;
}
