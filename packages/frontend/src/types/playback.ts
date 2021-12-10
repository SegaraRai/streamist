import type { Artist } from '$prisma/client';
import type { ResourceAlbum, ResourcePlaylist } from '$/types';
import type { ImageWithFile } from './image';
import type { TrackWithFile } from './track';

export interface AlbumForPlayback extends ResourceAlbum {
  artist: Artist;
  images: ImageWithFile[];
}

export interface TrackForPlayback extends TrackWithFile {
  album: AlbumForPlayback;
  artist: Artist;
}

export interface AlbumForPlaybackWithTracks extends AlbumForPlayback {
  tracks: TrackForPlayback[];
}

export interface ArtistForPlayback extends Artist {
  albums: AlbumForPlaybackWithTracks[];
  tracks: TrackForPlayback[];
}

export interface PlaylistForPlayback extends ResourcePlaylist {
  tracks: TrackForPlayback[];
}
