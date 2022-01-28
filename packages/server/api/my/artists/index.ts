import type { ResourceArtist } from '$/types';

export type Methods = {
  get: {
    resBody: ResourceArtist[];
  };
  // アルバムやトラックのPATCHから作成できるのでとりあえずここにはPOSTは設けない
};
