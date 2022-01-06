import type { Artist } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Artist;
  };
  patch: {
    // NOTE: APIがstableになるまでvalidatorは作成しない
    reqBody: Pick<Artist, 'name'>;
  };
  // NOTE: DELETEはとりあえずは作成しない、アーティストは参照されなくなると削除される
};
