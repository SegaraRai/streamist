import type { Track } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Track;
  };
  patch: {
    query?: {
      forceNewArtist?: boolean | number;
      forceNewAlbum?: boolean | number;
      preferAlbumArtist?: boolean | number;
    };
    // NOTE: APIがstableになるまでvalidatorは作成しない
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
