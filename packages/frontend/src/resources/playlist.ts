import { db } from '~/db';
import type { PlaylistWithTrackFile } from '~/types/playlist';
import { fetchPlaylistTracks } from './utils';

export async function fetchPlaylistWithTrack(
  playlistId: string
): Promise<PlaylistWithTrackFile> {
  const { playlist, tracks } = await db.transaction(
    'r',
    [db.albums, db.artists, db.tracks],
    async () => {
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        throw new Error(`Playlist ${playlistId} not found`);
      }
      const tracks = await fetchPlaylistTracks(playlist);
      return {
        playlist,
        tracks,
      };
    }
  );
  return {
    ...playlist,
    tracks,
  };
}
