import type { AlbumWithImage } from '~/types/album';

export function getDefaultAlbumImage<T extends AlbumWithImage>(
  album: T
): T['images'][0] | undefined {
  return album.images?.[0];
}
