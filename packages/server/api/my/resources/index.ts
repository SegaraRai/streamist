import type { Resources } from '$/types';

export type Methods = {
  get: {
    query?: {
      since?: number;
    };
    resBody: Resources;
  };
};
