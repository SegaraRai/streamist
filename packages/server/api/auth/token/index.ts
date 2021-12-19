export type Methods = {
  get: {
    reqBody: {
      refreshToken: string;
    };
    resBody: {
      apiToken: string;
      cdnToken: string;
    };
  };
};
