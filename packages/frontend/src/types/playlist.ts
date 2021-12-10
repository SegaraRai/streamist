import type { ResourcePlaylist } from '$/types';
import type { TrackWithFile } from './track';

export interface PlaylistWithTrackFile extends ResourcePlaylist {
  tracks: TrackWithFile[];
}
