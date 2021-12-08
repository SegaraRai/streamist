import type { Album, Artist, Track } from '$prisma/client';
import type { ImageWithFile } from './image';

export interface AlbumForPlayback extends Album {
  artist: Artist;
  images: ImageWithFile[];
}

export interface TrackForPlayback extends Track {
  album: AlbumForPlayback;
  artist: Artist;
  lyric: string;
}
