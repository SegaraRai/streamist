import type { AlbumWithImageFile } from '~/types/album';

export function getDefaultAlbumImage<T extends AlbumWithImageFile>(
  album: T
): T['images'][0] | undefined {
  return album.images?.[0];
}
