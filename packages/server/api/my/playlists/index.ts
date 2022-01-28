import type { ResourcePlaylist } from '$/types';
import type { VPlaylistCreateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: ResourcePlaylist[];
  };
  post: {
    reqBody: VPlaylistCreateBody;
    resBody: ResourcePlaylist;
  };
};
