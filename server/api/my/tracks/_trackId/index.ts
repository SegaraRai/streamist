import type { Track } from '$prisma/client';

export type Methods = {
  get: {
    query?: {
      includeTrackArtist?: boolean | number;
      includeAlbum?: boolean | number;
      includeAlbumArtist?: boolean | number;
      includeAlbumImages?: boolean | number;
    };
    resBody: Track;
  };
  patch: {
    query?: {
      forceNewArtist?: boolean | number;
      forceNewAlbum?: boolean | number;
      preferAlbumArtist?: boolean | number;
    };
    reqBody: Partial<Pick<Track, 'title' | 'albumId' | 'artistId'>> & {
      artistName?: string;
      albumTitle?: string;
    };
    resBody: Track;
  };
  delete: {
    status: 204;
  };
};
