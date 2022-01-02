import type { Album } from '$prisma/client';

export type Methods = {
  get: {
    query?: {
      includeAlbumArtist?: boolean;
      includeAlbumImages?: boolean;
      includeTrackArtist?: boolean;
      includeTracks?: boolean;
    };
    resBody: Album;
  };
  patch: {
    reqBody: Pick<Album, 'title'>;
  };
  // NOTE: DELETEはとりあえずは作成しない、アルバムはトラックをすべて削除すると削除される
};
