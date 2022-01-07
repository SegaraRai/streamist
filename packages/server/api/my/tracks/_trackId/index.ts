import type { Track } from '$prisma/client';
import type { VTrackUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: Track;
  };
  patch: {
    query?: {
      forceNewArtist?: boolean | number;
      forceNewAlbum?: boolean | number;
      preferOldArtist?: boolean | number;
      preferAlbumArtist?: boolean | number;
    };
    reqBody: VTrackUpdateBody;
    resBody: Track;
  };
  delete: {
    status: 204;
  };
};
