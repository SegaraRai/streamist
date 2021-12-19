import type { ResourcesNotUpdated, ResourcesUpdated } from '$/types';

export type Methods = {
  get: {
    query?: {
      since?: number;
    };
    resBody: ResourcesNotUpdated | ResourcesUpdated;
  };
};
