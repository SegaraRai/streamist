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
    reqBody: Pick<Artist, 'name'>;
  };
};
