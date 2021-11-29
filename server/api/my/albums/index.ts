import type { Album } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Album[];
  };
  post: {
    query?: {
      forceNewAlbum?: boolean | number;
    };
    reqBody: Pick<Album, 'title' | 'artistId'>;
    resBody: Album;
  };
};
