import type { Track } from '$prisma/client';
import type { VPlaylistAddTrackBody } from '$/validators';

export type Methods = {
  get: {
    resBody: Track[];
  };
  post: {
    reqBody: VPlaylistAddTrackBody;
  };
};
