import type { ResourcePlaylist } from '$/types';
import type { VPlaylistUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: ResourcePlaylist;
  };
  patch: {
    reqBody: VPlaylistUpdateBody;
  };
  delete: {};
};
