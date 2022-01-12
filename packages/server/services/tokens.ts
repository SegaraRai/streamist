import { createSigner, createVerifier } from 'fast-jwt';
import { randomBytesAsync } from '$shared-server/randomBytesAsync';
import { client } from '$/db/lib/client';
import { HTTPError } from '$/utils/httpError';
import type { IAuthRequest, IAuthResponse } from '$/validators';
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

export async function issueTokens(body: IAuthRequest): Promise<IAuthResponse> {
  let userId: string;

  switch (body.grant_type) {
    case 'password': {
      const user = await client.user.findUnique({
        where: {
          id: String(body.username),
        },
      });

      if (!user) {
        throw new HTTPError(404, `User ${body.username} not found`);
      }

      // TODO(auth): check if password is correct
      if (String(body.password) !== 'password') {
        throw new HTTPError(401, 'Invalid password');
      }

      userId = user.id;

      break;
    }

    case 'refresh_token': {
      const extractedUserId = await extractUserIdFromRefreshToken(
        String(body.refresh_token)
      );
      if (!extractedUserId) {
        throw new HTTPError(401, 'Invalid refresh token');
      }
      // TODO(auth): check if refresh token is not revoked
      userId = extractedUserId;
      break;
    }

    default:
      throw new HTTPError(400, 'Invalid grant type');
  }

  const timestamp = Date.now();
  const apiToken = await issueAPIToken(userId, timestamp);
  const cdnToken = await issueCDNToken(userId, timestamp);
  const refreshToken =
    body.grant_type === 'password'
      ? await issueRefreshToken(userId, timestamp)
      : undefined;

  return {
    access_token: apiToken,
    cdn_access_token: cdnToken,
    refresh_token: refreshToken,
  };
}
