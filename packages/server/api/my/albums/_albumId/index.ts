import type { ResourceAlbum } from '$/types';
import type { VAlbumMergeBody, VAlbumUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: ResourceAlbum;
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
