export type Methods = {
  post: {
    reqBody:
      | {
          grant_type: 'password';
          username: string;
          password: string;
        }
      | {
          grant_type: 'refresh_token';
          refresh_token: string;
        };
    resBody: {
      access_token: string;
      cdn_access_token: string;
      refresh_token?: string;
    };
  };
};
