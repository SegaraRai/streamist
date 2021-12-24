import { ResourceAlbum, ResourceArtist, ResourceImage } from '$/types';

export function getDefaultAlbumImage(
  album: ResourceAlbum,
  imageMap: ReadonlyMap<string, ResourceImage>
): ResourceImage | undefined {
  if (!album.imageIds.length) {
    return;
  }
  return imageMap.get(album.imageIds[0]);
}

/**
 * albums must be sorted by `compareAlbum`
 */
export function getDefaultArtistImage(
  artist: ResourceArtist,
  albums: readonly ResourceAlbum[],
  imageMap: ReadonlyMap<string, ResourceImage>
): ResourceImage | undefined {
  if (artist.imageIds.length) {
    return imageMap.get(artist.imageIds[0]);
  }
  const filteredAlbums = albums.filter((album) => album.artistId === artist.id);
  const imageId = filteredAlbums.find((album) => album.imageIds.length)
    ?.imageIds[0];
  return imageId ? imageMap.get(imageId) : undefined;
}
