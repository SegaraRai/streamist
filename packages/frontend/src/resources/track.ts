import { db } from '~/db';
import { compareTrack } from '~/logic/sort';
import type { TrackForPlayback } from '~/types/playback';
import { fetchAlbumsForPlaybackWithTracks } from './album';
import { fetchAlbumImages } from './utils';

export async function fetchTrackForPlayback(
  trackId: string
): Promise<TrackForPlayback> {
  const { album, albumArtist, artist, images, track } = await db.transaction(
    'r',
    [db.albums, db.artists, db.tracks],
    async () => {
      const track = await db.tracks.get(trackId);
      if (!track) {
        throw new Error(`Track ${trackId} not found`);
      }
      const [album, artist] = await Promise.all([
        db.albums.get(track.albumId),
        db.artists.get(track.artistId),
      ]);
      if (!album) {
        throw new Error(
          `Album ${track.albumId} not found. (database corrupted)`
        );
      }
      if (!artist) {
        throw new Error(
          `Artist ${track.artistId} not found. (database corrupted)`
        );
      }
      const albumArtist =
        album.artistId === track.artistId
          ? artist
          : await db.artists.get(album.artistId);
      if (!albumArtist) {
        throw new Error(
          `Album artist ${album.artistId} not found. (database corrupted)`
        );
      }
      const images = await fetchAlbumImages(album);
      return {
        track,
        album,
        artist,
        albumArtist,
        images,
      };
    }
  );
  return {
    ...track,
    artist,
    album: {
      ...album,
      artist: albumArtist,
      images,
    },
  };
}

export async function fetchTracksForPlayback(): Promise<TrackForPlayback[]> {
  return (await fetchAlbumsForPlaybackWithTracks())
    .flatMap((album) => album.tracks)
    .sort(compareTrack);
}
