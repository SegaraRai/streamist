import type { LoginBody } from '$/validators';

export type Methods = {
  post: {
    reqBody: LoginBody;
    resBody: {
      refreshToken: string;
      apiToken: string;
      cdnToken: string;
    };
  };
};
