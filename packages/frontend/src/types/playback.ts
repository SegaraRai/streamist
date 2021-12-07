import type { Album, Artist, Track } from '$prisma/client';
import type { AlbumImageWithImageFile } from './image';

export interface AlbumForPlayback extends Album {
  artist: Artist;
  images: AlbumImageWithImageFile[];
}

export interface TrackForPlayback extends Track {
  album: AlbumForPlayback;
  artist: Artist;
  lyric: string;
}
