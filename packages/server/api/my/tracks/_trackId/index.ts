import type { ResourceTrack, ResourceTrackSimple } from '$/types';
import type { VTrackUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: ResourceTrack;
  };
  patch: {
    query?: {
      forceNewArtist?: boolean | number;
      forceNewAlbum?: boolean | number;
      preferOldArtist?: boolean | number;
      preferAlbumArtist?: boolean | number;
    };
    reqBody: VTrackUpdateBody;
    resBody: ResourceTrackSimple;
  };
  delete: {
    status: 204;
  };
};
