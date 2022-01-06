import type { Album } from '$prisma/client';

export type Methods = {
  get: {
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
