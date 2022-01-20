import type { VAccountCheckQuery, VAccountCreateData } from '$/validators';

export type Methods = {
  get: {
    query: VAccountCheckQuery;
    resBody: {
      exists: boolean;
    };
  };
  post: {
    query: {
      captchaResponse: string;
    };
    reqBody: VAccountCreateData;
  };
};
