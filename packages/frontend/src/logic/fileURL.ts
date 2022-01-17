import type { ResourceImage, ResourceTrack } from '$/types';
import { CDN_ENDPOINT } from '~/config';

export function getTrackFileURL(
  userId: string,
  trackId: string,
  file: Pick<ResourceTrack['files'][number], 'id' | 'region' | 'extension'>
): string {
  return `${CDN_ENDPOINT}/files/${file.region}/audios/${userId}/${trackId}/${file.id}${file.extension}`;
}

export function getImageFileURL(
  userId: string,
  imageId: string,
  file: Pick<ResourceImage['files'][number], 'id' | 'region' | 'extension'>
): string {
  return `${CDN_ENDPOINT}/files/${file.region}/images/${userId}/${imageId}/${file.id}${file.extension}`;
}
