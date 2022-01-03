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
    reqBody: Partial<Pick<Playlist, 'title' | 'notes'>>;
  };
  delete: {};
};
