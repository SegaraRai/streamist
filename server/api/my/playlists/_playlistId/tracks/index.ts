import type { Track } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Track[];
  };
  post: {
    reqBody: { trackId: string };
  };
};
