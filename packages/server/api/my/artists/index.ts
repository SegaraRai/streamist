import type { Artist } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Artist[];
  };
  post: {
    query?: {
      forceNewArtist?: boolean | number;
    };
    reqBody: Pick<Artist, 'name'>;
    resBody: Artist;
  };
};
