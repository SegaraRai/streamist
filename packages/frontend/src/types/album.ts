import type { Album, Artist } from '$prisma/client';
import type { ImageWithFile } from './image';
import type { TrackForPlayback } from './playback';

export interface AlbumWithImageFile extends Album {
  images: ImageWithFile[];
}

export interface AlbumWithArImTr extends Album {
  artist: Artist;
  images: ImageWithFile[];
  tracks: TrackForPlayback[];
}
