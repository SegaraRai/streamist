import type { Album } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Album;
  };
  patch: {
    // NOTE: APIがstableになるまでvalidatorは作成しない
    reqBody: Pick<Album, 'title'>;
  };
  // NOTE: DELETEはとりあえずは作成しない、アルバムはトラックをすべて削除すると削除される
};
