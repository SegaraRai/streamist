import type { CreateSourceResponse } from '$/types';
import type { VSourceCreateBodyWrapper } from '$/validators';

export type Methods = {
  post: {
    reqBody: VSourceCreateBodyWrapper['!payload'];
    resBody: CreateSourceResponse;
  };
};
