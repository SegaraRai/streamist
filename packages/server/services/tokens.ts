import { User } from '@prisma/client';
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
  user: User,
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
      id: user.id,
      sub: user.id,
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

export function issueAPIToken(user: User, timestamp: number): Promise<string> {
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
      id: user.id,
      sub: user.id,
    })
  );
}

export function issueCDNToken(user: User, timestamp: number): Promise<string> {
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
      id: user.id,
      sub: user.id,
      plan: user.plan,
      maxTrackId: user.maxTrackId,
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
  let user: User;

  switch (body.grant_type) {
    case 'password': {
      const tempUser = await client.user.findUnique({
        where: {
          id: String(body.username),
        },
      });

      if (!tempUser) {
        throw new HTTPError(404, `User ${body.username} not found`);
      }

      // TODO(auth): check if password is correct
      if (String(body.password) !== 'password') {
        throw new HTTPError(401, 'Invalid password');
      }

      user = tempUser;

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

      const tempUser = await client.user.findUnique({
        where: {
          id: extractedUserId,
        },
      });

      if (!tempUser) {
        throw new HTTPError(404, `User ${extractedUserId} not found`);
      }

      user = tempUser;

      break;
    }

    default:
      throw new HTTPError(400, 'Invalid grant type');
  }

  const timestamp = Date.now();
  const apiToken = await issueAPIToken(user, timestamp);
  const cdnToken = await issueCDNToken(user, timestamp);
  const refreshToken =
    body.grant_type === 'password'
      ? await issueRefreshToken(user, timestamp)
      : undefined;

  return {
    access_token: apiToken,
    cdn_access_token: cdnToken,
    refresh_token: refreshToken,
  };
}
