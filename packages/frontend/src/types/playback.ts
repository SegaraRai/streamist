import type {
  ResourceAlbum,
  ResourceArtist,
  ResourceImage,
  ResourcePlaylist,
  ResourceTrack,
} from '$/types';

export interface AlbumForPlayback extends ResourceAlbum {
  artist: ResourceArtist;
  images: ResourceImage[];
}

export interface TrackForPlayback extends ResourceTrack {
  album: AlbumForPlayback;
  artist: ResourceArtist;
}

export interface AlbumForPlaybackWithTracks extends AlbumForPlayback {
  tracks: TrackForPlayback[];
}

export interface ArtistForPlayback extends ResourceArtist {
  albums: AlbumForPlaybackWithTracks[];
  tracks: TrackForPlayback[];
}

export interface PlaylistForPlayback extends ResourcePlaylist {
  tracks: TrackForPlayback[];
}
