import type { ImageFile, TrackFile } from '$prisma/client';
import { CDN_ENDPOINT } from './cdn';

export function getTrackFileURL(file: TrackFile): string {
  return `${CDN_ENDPOINT}/files/${file.region}/audios/${file.userId}/${file.trackId}/${file.id}${file.extension}`;
}

export function getImageFileURL(file: ImageFile): string {
  return `${CDN_ENDPOINT}/files/${file.region}/images/${file.userId}/${file.imageId}/${file.id}${file.extension}`;
}
