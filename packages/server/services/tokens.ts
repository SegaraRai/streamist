import { createSigner, createVerifier } from 'fast-jwt';
import { randomBytesAsync } from '$shared-server/randomBytesAsync';
import {
  SECRET_API_JWT_SECRET,
  SECRET_CDN_JWT_SECRET,
  SECRET_REFRESH_TOKEN_JWT_SECRET,
} from './env';

export const REFRESH_TOKEN_EXPIRES_IN = 1 * 24 * 60 * 60 * 1000;
export const API_TOKEN_EXPIRES_IN = 60 * 1000;
export const CDN_TOKEN_EXPIRES_IN = API_TOKEN_EXPIRES_IN;

export async function issueRefreshToken(
  userId: string,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: 'HS256',
    jti: `R.${(await randomBytesAsync(32)).toString('hex')}`,
    key: SECRET_REFRESH_TOKEN_JWT_SECRET,
    aud: 'refresh',
    iss: 'https://streamist.app',
    clockTimestamp: timestamp,
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: userId,
      sub: userId,
    })
  );
}

export async function extractUserIdFromRefreshToken(
  token: string
): Promise<string | undefined> {
  const verifier = createVerifier({
    algorithms: ['HS256'],
    key: SECRET_REFRESH_TOKEN_JWT_SECRET,
    allowedAud: 'refresh',
  });

  try {
    const payload = await verifier(String(token));
    return payload.id as string;
  } catch (_error: unknown) {}
}

export function issueAPIToken(
  userId: string,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: 'HS256',
    key: SECRET_API_JWT_SECRET,
    aud: 'api',
    iss: 'https://streamist.app',
    clockTimestamp: timestamp,
    expiresIn: API_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: userId,
      sub: userId,
    })
  );
}

export function issueCDNToken(
  userId: string,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: 'HS256',
    key: SECRET_CDN_JWT_SECRET,
    aud: 'cdn',
    iss: 'https://streamist.app',
    clockTimestamp: timestamp,
    expiresIn: CDN_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: userId,
      sub: userId,
    })
  );
}

export async function extractPayloadFromCDNToken(
  token: string
): Promise<{ id: string; exp: number } | undefined> {
  const verifier = createVerifier({
    algorithms: ['HS256'],
    key: SECRET_CDN_JWT_SECRET,
    allowedAud: 'cdn',
  });

  try {
    return await verifier(String(token));
  } catch (_error: unknown) {}
}
