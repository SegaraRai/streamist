import type { Album } from '$prisma/client';

export type Methods = {
  get: {
    query?: {
      includeAlbumArtist?: boolean;
      includeAlbumImages?: boolean;
      includeTrackArtist?: boolean;
      includeTracks?: boolean;
    };
    resBody: Album[];
  };
  post: {
    query?: {
      forceNewAlbum?: boolean | number;
    };
    // NOTE: APIがstableになるまでvalidatorは作成しない
    reqBody: Pick<Album, 'title' | 'artistId'>;
    resBody: Album;
  };
};
