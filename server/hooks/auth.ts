import { HTTPError } from '$/utils/httpError';
import type { OnRequestHookHandler } from './types';

export type AdditionalRequest = {
  user: {
    id: string;
  };
};

// cannot export `Hooks` directly as they are not recognized by the frourio
export const onRequest: OnRequestHookHandler = async (
  request
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch (error: unknown) {
    // TODO(ES2022): use Error.cause
    throw new HTTPError(
      401,
      error instanceof Error ? error.message : String(error)
    );
  }
};
