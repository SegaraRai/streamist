import { HS256, JWT } from 'worktop/jwt';
import type { Bindings } from './types';

export interface JWTPayload extends JWT.Claims {
  id: string;
  sub: string;
  exp: number;
  aud: string;
  iss: string;
  plan: string;
  maxTrackId: string | null;
}

const createHS256 = (context: Bindings) =>
  HS256<JWTPayload>({
    key: context.bindings.SECRET_CDN_JWT_SECRET,
  });

export const verifyJWT = (
  jwt: string,
  context: Bindings
): Promise<JWTPayload | undefined> =>
  createHS256(context)
    .verify(jwt)
    .catch(() => undefined);
