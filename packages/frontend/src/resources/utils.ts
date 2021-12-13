import { db } from '~/db';
import type {
  ResourceAlbum,
  ResourceImage,
  ResourcePlaylist,
  ResourceTrack,
} from '$/types';

export async function fetchAlbumImages(
  album: ResourceAlbum
): Promise<ResourceImage[]> {
  return (await db.images.bulkGet(album.imageIds)).filter(
    (item, index): item is ResourceImage => {
      if (!item) {
        throw new Error(
          `Image ${album.imageIds[index]} not found. (database corrupted)`
        );
      }
      return true;
    }
  );
}

export async function fetchPlaylistTracks(
  playlist: ResourcePlaylist
): Promise<ResourceTrack[]> {
  return (await db.tracks.bulkGet(playlist.trackIds)).filter(
    (item, index): item is ResourceTrack => {
      if (!item) {
        throw new Error(
          `Track ${playlist.trackIds[index]} not found. (database corrupted)`
        );
      }
      return true;
    }
  );
}
