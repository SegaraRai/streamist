import type { SourceFile } from '$prisma/client';

export type Methods = {
  patch: {
    reqBody: Pick<SourceFile, 'uploaded'>;
    status: 204;
  };
};
