import type {
  CreateSourceRequestAudio,
  CreateSourceRequestImage,
  CreateSourceResponse,
} from '$/types';

export type Methods = {
  post: {
    reqBody: CreateSourceRequestAudio | CreateSourceRequestImage;
    resBody: CreateSourceResponse;
  };
};
