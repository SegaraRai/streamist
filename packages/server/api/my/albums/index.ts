import type { Album } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Album[];
  };
};
