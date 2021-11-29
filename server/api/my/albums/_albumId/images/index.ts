import type { Image } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Image[];
  };
  post: {
    reqBody: { imageId: string };
  };
};
