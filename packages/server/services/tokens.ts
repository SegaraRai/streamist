import { createSigner, createVerifier } from 'fast-jwt';
import { randomBytesAsync } from '$shared-server/randomBytesAsync';
import { SECRET_API_JWT_SECRET } from './env';

export const REFRESH_TOKEN_EXPIRES_IN = 1 * 24 * 60 * 60 * 1000;
export const API_TOKEN_EXPIRES_IN = 1 * 60 * 60 * 1000;
export const CDN_TOKEN_EXPIRES_IN = API_TOKEN_EXPIRES_IN;

export async function issueRefreshToken(
  userId: string,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: 'HS256',
    jti: `R.${(await randomBytesAsync(32)).toString('hex')}`,
    key:
      process.env.SECRET_REFRESH_TOKEN_JWT_SECRET || 'REFRESH_TOKEN_JWT_SECRET',
    aud: 'refresh',
    clockTimestamp: timestamp,
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
  signer({
    id: userId,
  });
  return Promise.resolve(
    signer({
      id: userId,
    })
  );
}

export async function extractUserIdFromRefreshToken(
  token: string
): Promise<string | undefined> {
  const verifier = createVerifier({
    algorithms: ['HS256'],
    key:
      process.env.SECRET_REFRESH_TOKEN_JWT_SECRET || 'REFRESH_TOKEN_JWT_SECRET',
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
    clockTimestamp: timestamp,
    expiresIn: API_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: userId,
    })
  );
}

export function issueCDNToken(
  userId: string,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: 'HS256',
    key: process.env.SECRET_CDN_TOKEN_JWT_SECRET || 'CDN_TOKEN_JWT_SECRET',
    aud: 'cdn',
    clockTimestamp: timestamp,
    expiresIn: CDN_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: userId,
    })
  );
}
