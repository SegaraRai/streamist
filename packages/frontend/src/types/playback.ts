import type { Album, Artist, Track } from '$prisma/client';
import type { ImageWithFile } from './image';

export interface AlbumForPlayback extends Album {
  artist: Artist;
  images: ImageWithFile[];
}

export interface TrackForPlayback extends Track {
  album: AlbumForPlayback;
  artist: Artist;
}

export interface AlbumForPlaybackWithTracks extends AlbumForPlayback {
  tracks: TrackForPlayback[];
}
