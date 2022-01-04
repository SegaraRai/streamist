import type { VAuthBodyWrapper } from '$/validators';

export type Methods = {
  post: {
    reqBody: VAuthBodyWrapper['!payload'];
    resBody: {
      access_token: string;
      cdn_access_token: string;
      refresh_token?: string;
    };
  };
};
