import { clockTolerance } from '@streamist/shared/lib/config/jwt';
import { JWTPayload, JWTToken, isValid as isValidJWT } from './jwt';

export type JWTCheckResult = 'HIT-Edge' | 'HIT-KV' | 'MISS' | false;

/**
 * checks wether `jwt` is validated and is in edge local context or not.
 * @param jwt JWT string
 * @returns `true` if JWT is in edge local context
 */
async function isJWTValidatedInEdge(jwt: string): Promise<boolean> {
  try {
    const expiration = self.jwtCache?.get(jwt);
    if (!expiration) {
      return false;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (expiration + clockTolerance <= currentTime) {
      self.jwtCache?.delete(jwt);
      return false;
    }
    return true;
  } catch (_error) {
    // do nothing
  }
  return false;
}

/**
 * checks wether `jwt` is validated and is in KV or not.
 * @param jwt JWT string
 * @returns `true` if JWT is in KV
 */
async function isJWTValidatedInKV(jwt: string): Promise<boolean> {
  try {
    return !!(await kvJWTCache.get(jwt));
  } catch (_error) {
    // do nothing
  }
  return false;
}

/**
 * stores `jwt` to edge local context and KV \
 * `jwt` must be validated
 * @param jwt JWT string
 * @param payload JWT payload
 */
async function storeValidatedJWT(
  jwt: string,
  payload: JWTPayload
): Promise<void> {
  try {
    const { exp } = payload;
    if (!exp) {
      // should not occur
      // do nothing
      return;
    }

    // edge
    if (!self.jwtCache) {
      self.jwtCache = new Map<string, number>();
    }
    self.jwtCache.set(jwt, exp);

    // KV
    // make expiration longer to reduce calculation
    await kvJWTCache.put(jwt, '1', {
      expiration: exp + clockTolerance * 2,
    });
  } catch (_error) {
    // do nothing
  }
}

export async function checkAndStoreJWT(
  jwt: string,
  parsedJWT: JWTToken
): Promise<JWTCheckResult> {
  const cachedResultEdge = await isJWTValidatedInEdge(jwt);
  if (cachedResultEdge) {
    return 'HIT-Edge';
  }
  const cachedResultKV = await isJWTValidatedInKV(jwt);
  if (cachedResultKV) {
    return 'HIT-KV';
  }
  const result = await isValidJWT(parsedJWT);
  if (!result) {
    return false;
  }
  await storeValidatedJWT(jwt, parsedJWT.payload$$q);
  return 'MISS';
}
