import { ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID } from '$shared/dbConfig';
import { dbLinkedListSort } from '$shared/linkedListSort';
import type { AlbumImageWithImage } from '~/types/image';

export function getSortedAlbumImages<T extends AlbumImageWithImage>(
  albumImages: readonly T[]
): T['image'][] {
  if (albumImages.length === 0) {
    return [];
  }

  return dbLinkedListSort(
    albumImages,
    'imageId',
    'nextImageId',
    ALBUM_IMAGE_SENTINEL_NODE_IMAGE_ID
  ).map((item) => item.image);
}

export function getDefaultAlbumImage<T extends AlbumImageWithImage>(
  albumImages: readonly T[]
): T['image'] | undefined {
  return getSortedAlbumImages(albumImages)[0];
}
