import type { ImageFile, TrackFile } from '$prisma/client';

const DEV_API_CDN_ENDPOINT = `${import.meta.env.VITE_API_ORIGIN}/dev/cdn`;

export function getTrackFileURL(file: TrackFile): string {
  if (import.meta.env.DEV) {
    return `${DEV_API_CDN_ENDPOINT}/${file.region}/audio/${file.userId}/${file.id}${file.extension}`;
  }
  throw new Error('not implemented');
}

export function getImageFileURL(file: ImageFile): string {
  if (import.meta.env.DEV) {
    return `${DEV_API_CDN_ENDPOINT}/${file.region}/image/${file.userId}/${file.id}${file.extension}`;
  }
  throw new Error('not implemented');
}
