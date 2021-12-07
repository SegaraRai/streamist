import { PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID } from '$shared/dbConfig';
import { dbLinkedListSort } from '$shared/linkedListSort';
import { PlaylistTrackWithTrack } from '~/types/track';

export function getSortedPlaylistTracks<T extends PlaylistTrackWithTrack>(
  playlistTracks: readonly T[]
): T['track'][] {
  if (playlistTracks.length === 0) {
    return [];
  }

  return dbLinkedListSort(
    playlistTracks,
    'trackId',
    'nextTrackId',
    PLAYLIST_TRACK_SENTINEL_NODE_TRACK_ID
  ).map((item) => item.track);
}
