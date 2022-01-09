import type { Artist } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Artist[];
  };
  // アルバムやトラックのPATCHから作成できるのでとりあえずここにはPOSTは設けない
};
