import type { Playlist } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Playlist[];
  };
  post: {
    reqBody: Pick<Playlist, 'title' | 'notes'>;
    resBody: Playlist;
  };
};
