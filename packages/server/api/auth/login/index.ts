import type { VAuthBodyPassword } from '$/validators';

export type Methods = {
  post: {
    reqBody: VAuthBodyPassword;
    resBody: {
      access_token: string;
      cdn_access_token: string;
      refresh_token: string;
    };
  };
};
