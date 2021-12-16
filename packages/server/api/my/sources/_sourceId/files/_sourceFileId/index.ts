import type { SourceFileState } from '$shared/types/db';

export type Methods = {
  patch: {
    reqBody: {
      state: SourceFileState & 'uploaded';
      parts?: string[];
    };
  };
};
