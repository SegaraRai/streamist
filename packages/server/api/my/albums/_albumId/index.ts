import type { Album } from '$prisma/client';
import type { VAlbumMergeBody, VAlbumUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: Album;
  };
  patch: {
    reqBody: VAlbumUpdateBody;
    query?: {
      forceNewArtist?: boolean | number;
    };
  };
  post: {
    reqBody: VAlbumMergeBody;
  };
  // NOTE: DELETEはとりあえずは作成しない、アルバムはトラックをすべて削除すると削除される
};
