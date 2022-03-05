import { HS256, JWT } from 'worktop/jwt';
import type { Plan } from '$shared/config';
import type { WSBindings } from './types';

export interface JWTPayload extends JWT.Claims {
  id: string;
  sub: string;
  exp: number;
  aud: string;
  iss: string;
  plan: Plan;
}

const createHS256 = (bindings: WSBindings) =>
  HS256<JWTPayload>({
    key: bindings.SECRET_WS_JWT_SECRET,
  });

export const verifyJWT = (
  jwt: string,
  bindings: WSBindings
): Promise<JWTPayload | undefined> =>
  createHS256(bindings)
    .verify(jwt)
    .catch(() => undefined);
