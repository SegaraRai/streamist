import type { Image, ImageFile } from '$prisma/client';

export type Methods = {
  get: {
    resBody: (Image & { files: ImageFile[] })[];
  };
  post: {
    reqBody: { imageId: string };
  };
};
