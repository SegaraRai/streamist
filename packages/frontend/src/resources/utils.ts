import { db } from '~/db';
import type { ImageWithFile } from '~/types/image';
import { TrackWithFile } from '~/types/track';
import type { ResourceAlbum, ResourcePlaylist } from '$/types';

export async function fetchAlbumImages(
  album: ResourceAlbum
): Promise<ImageWithFile[]> {
  return (await db.images.bulkGet(album.imageIds)).filter(
    (item, index): item is ImageWithFile => {
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
): Promise<TrackWithFile[]> {
  return (await db.tracks.bulkGet(playlist.trackIds)).filter(
    (item, index): item is TrackWithFile => {
      if (!item) {
        throw new Error(
          `Track ${playlist.trackIds[index]} not found. (database corrupted)`
        );
      }
      return true;
    }
  );
}
