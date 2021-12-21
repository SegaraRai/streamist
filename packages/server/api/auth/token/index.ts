export type Methods = {
  post: {
    reqBody: {
      refreshToken: string;
    };
    resBody: {
      apiToken: string;
      cdnToken: string;
      refreshToken?: string;
    };
  };
};
