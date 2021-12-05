import type { Playlist } from '$prisma/client';

export type Methods = {
  get: {
    query?: {
      includeTracks?: boolean | number;
      includeTrackArtist?: boolean | number;
      includeTrackAlbum?: boolean | number;
      includeTrackAlbumArtist?: boolean | number;
      includeTrackAlbumImages?: boolean | number;
    };
    resBody: Playlist;
  };
  patch: {
    reqBody: Pick<Playlist, 'title'>;
    status: 204;
  };
  delete: {
    status: 204;
  };
};
