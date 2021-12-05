import type { Source, SourceFile } from '$prisma/client';

export type Methods = {
  get: {
    resBody: Source & { files: SourceFile[] };
  };
};
