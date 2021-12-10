import type { Playlist } from '$prisma/client';
import type { TrackWithFile } from './track';

export interface PlaylistWithTrackFile extends Playlist {
  tracks: TrackWithFile[];
}
