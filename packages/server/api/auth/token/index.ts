import type { VAuthBodyRefreshToken } from '$/validators';

export type Methods = {
  post: {
    reqBody: VAuthBodyRefreshToken;
    resBody: {
      access_token: string;
      cdn_access_token: string;
      ws_access_token: string;
      refresh_token?: string;
    };
  };
};
