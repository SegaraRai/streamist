import type { ResourceSource, ResourceSourceFile } from '$/types';

export type Methods = {
  get: {
    resBody: ResourceSource & { files: ResourceSourceFile[] };
  };
};
