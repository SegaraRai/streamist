import type { Playlist } from '$prisma/client';
import type { VPlaylistCreateBody } from '$/validators';

export type Methods = {
  get: {
    resBody: Playlist[];
  };
  post: {
    reqBody: VPlaylistCreateBody;
    resBody: Playlist;
  };
};
