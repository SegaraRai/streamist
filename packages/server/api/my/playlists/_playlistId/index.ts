import type { Playlist } from '$prisma/client';
import type { VPlaylistUpdateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: Playlist;
  };
  patch: {
    reqBody: VPlaylistUpdateBody;
  };
  delete: {};
};
