import { HS256, JWT } from 'worktop/jwt';
import type { Bindings } from './types';

const createHS256 = (context: Bindings) =>
  HS256({
    key: context.bindings.SECRET_CDN_JWT_SECRET,
  });

export const verifyJWT = (
  jwt: string,
  context: Bindings
): Promise<JWT.Payload | undefined> =>
  createHS256(context)
    .verify(jwt)
    .catch(() => undefined);
