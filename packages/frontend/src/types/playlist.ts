import type { ResourcePlaylist, ResourceTrack } from '$/types';

export interface PlaylistWithTrackFile extends ResourcePlaylist {
  tracks: ResourceTrack[];
}
