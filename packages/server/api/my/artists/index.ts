import type { Artist } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Artist[];
  };
  post: {
    query?: {
      forceNewArtist?: boolean | number;
    };
    // NOTE: APIがstableになるまでvalidatorは作成しない
    reqBody: Pick<Artist, 'name'>;
    resBody: Artist;
  };
};
