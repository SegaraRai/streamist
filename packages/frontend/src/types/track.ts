import type { Playlist, Track, TrackFile } from '$prisma/client';

export interface TrackWithFile extends Track {
  files: TrackFile[];
}

export interface PlaylistWithTrackFile extends Playlist {
  tracks: TrackWithFile[];
}

export interface PlaylistWithTrack extends Playlist {
  tracks: Track[];
}
