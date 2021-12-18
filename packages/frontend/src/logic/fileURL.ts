import type { ImageFile, TrackFile } from '$prisma/client';

const DEV_S3_ENDPOINT_AP_NORTHEAST_1 =
  'https://ap-northeast-1.wasabisys.com/development-wasabi-ap-northeast-1.stst.page';

export function getTrackFileURL(file: TrackFile): string {
  if (import.meta.env.DEV) {
    switch (file.region) {
      case 'ap-northeast-1':
        return `${DEV_S3_ENDPOINT_AP_NORTHEAST_1}/tra/${file.userId}/${file.id}${file.extension}`;
    }
    throw new Error(`unknown region: ${file.region}`);
  }
  throw new Error('not implemented');
}

export function getImageFileURL(file: ImageFile): string {
  if (import.meta.env.DEV) {
    switch (file.region) {
      case 'ap-northeast-1':
        return `${DEV_S3_ENDPOINT_AP_NORTHEAST_1}/tri/${file.userId}/${file.id}${file.extension}`;
    }
    throw new Error(`unknown region: ${file.region}`);
  }
  throw new Error('not implemented');
}
