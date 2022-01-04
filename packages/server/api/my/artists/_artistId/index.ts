import type { Artist } from '$prisma/client';

export type Methods = {
  get: {
    query?: {
      includeAlbums?: boolean | number;
      includeAlbumImages?: boolean | number;
      includeTracks?: boolean | number;
      includeTrackAlbum?: boolean | number;
      includeTrackAlbumImages?: boolean | number;
    };
    resBody: Artist;
  };
  patch: {
    // NOTE: APIがstableになるまでvalidatorは作成しない
    reqBody: Pick<Artist, 'name'>;
  };
  // NOTE: DELETEはとりあえずは作成しない、アーティストは参照されなくなると削除される
};
