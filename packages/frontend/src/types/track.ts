import type { PlaylistTrack, Track, TrackFile } from '$prisma/client';

export interface TrackWithFile extends Track {
  files: TrackFile[];
}

export interface PlaylistTrackWithTrackFile extends PlaylistTrack {
  track: TrackWithFile;
}

export interface PlaylistTrackWithTrack extends PlaylistTrack {
  track: Track;
}
