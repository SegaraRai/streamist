import type { ResourceArtist } from '$/types';
import type { VArtistMergeBody, VArtistUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: ResourceArtist;
  };
  patch: {
    reqBody: VArtistUpdateBody;
  };
  post: {
    reqBody: VArtistMergeBody;
  };
  // NOTE: DELETEはとりあえずは作成しない、アーティストは参照されなくなると削除される
};
