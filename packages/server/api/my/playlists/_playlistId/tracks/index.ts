import type { ResourceTrackSimple } from '$/types';
import type { VPlaylistAddTrackBody } from '$/validators';

export type Methods = {
  get: {
    resBody: ResourceTrackSimple[];
  };
  post: {
    reqBody: VPlaylistAddTrackBody;
  };
};
