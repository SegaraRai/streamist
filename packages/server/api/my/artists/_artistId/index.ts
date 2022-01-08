import type { Artist } from '$prisma/client';
import type { VArtistMergeBody, VArtistUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: Artist;
  };
  patch: {
    reqBody: VArtistUpdateBody;
  };
  post: {
    reqBody: VArtistMergeBody;
  };
  // NOTE: DELETEはとりあえずは作成しない、アーティストは参照されなくなると削除される
};
