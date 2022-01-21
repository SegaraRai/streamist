import { User } from '@prisma/client';
import { createSigner, createVerifier } from 'fast-jwt';
import { randomBytesAsync } from '$shared-server/randomBytesAsync';
import {
  JWT_ALGORITHM,
  JWT_API_TOKEN_AUD,
  JWT_API_TOKEN_EXPIRES_IN,
  JWT_API_TOKEN_ISS,
  JWT_CDN_TOKEN_AUD,
  JWT_CDN_TOKEN_EXPIRES_IN,
  JWT_CDN_TOKEN_ISS,
  JWT_REFRESH_TOKEN_AUD,
  JWT_REFRESH_TOKEN_EXPIRES_IN,
  JWT_REFRESH_TOKEN_ISS,
} from '$shared/config';
import { client } from '$/db/lib/client';
import {
  SECRET_API_JWT_SECRET,
  SECRET_CDN_JWT_SECRET,
  SECRET_REFRESH_TOKEN_JWT_SECRET,
} from '$/services/env';
import { HTTPError } from '$/utils/httpError';
import type { IAuthRequest, IAuthResponse } from '$/validators';
import { verifyPasswordHashAsync } from './password';

type UserSubset = Pick<User, 'id' | 'maxTrackId' | 'plan'>;

export async function issueRefreshToken(
  user: UserSubset,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: JWT_ALGORITHM,
    jti: `R.${(await randomBytesAsync(32)).toString('hex')}`,
    key: SECRET_REFRESH_TOKEN_JWT_SECRET,
    aud: JWT_REFRESH_TOKEN_AUD,
    iss: JWT_REFRESH_TOKEN_ISS,
    clockTimestamp: timestamp,
    expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
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
    algorithms: [JWT_ALGORITHM],
    key: SECRET_REFRESH_TOKEN_JWT_SECRET,
    allowedAud: JWT_REFRESH_TOKEN_AUD,
  });

  try {
    const payload = await verifier(String(token));
    return payload.id as string;
  } catch (_error: unknown) {}
}

export function issueAPIToken(
  user: UserSubset,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: JWT_ALGORITHM,
    key: SECRET_API_JWT_SECRET,
    aud: JWT_API_TOKEN_AUD,
    iss: JWT_API_TOKEN_ISS,
    clockTimestamp: timestamp,
    expiresIn: JWT_API_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: user.id,
      sub: user.id,
    })
  );
}

export function issueCDNToken(
  user: UserSubset,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: JWT_ALGORITHM,
    key: SECRET_CDN_JWT_SECRET,
    aud: JWT_CDN_TOKEN_AUD,
    iss: JWT_CDN_TOKEN_ISS,
    clockTimestamp: timestamp,
    expiresIn: JWT_CDN_TOKEN_EXPIRES_IN,
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

// for dev
export async function extractPayloadFromCDNToken(
  token: string
): Promise<{ id: string; exp: number } | undefined> {
  const verifier = createVerifier({
    algorithms: [JWT_ALGORITHM],
    key: SECRET_CDN_JWT_SECRET,
    allowedAud: JWT_CDN_TOKEN_AUD,
  });

  try {
    return await verifier(String(token));
  } catch (_error: unknown) {}
}

export async function issueTokens(body: IAuthRequest): Promise<IAuthResponse> {
  let user: UserSubset;

  switch (body.grant_type) {
    case 'password': {
      const tempUser = await client.user.findUnique({
        where: {
          username: String(body.username),
        },
        select: {
          id: true,
          password: true,
          closedAt: true,
          plan: true,
          maxTrackId: true,
        },
      });
      if (!tempUser) {
        throw new HTTPError(404, `User ${body.username} not found`);
      }

      const isOk = await verifyPasswordHashAsync(
        String(body.password),
        tempUser.password
      );
      if (!isOk) {
        throw new HTTPError(401, 'Invalid password');
      }

      if (tempUser.closedAt != null) {
        await client.user.update({
          where: {
            id: tempUser.id,
          },
          data: {
            closedAt: null,
          },
        });
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
        select: {
          id: true,
          closedAt: true,
          plan: true,
          maxTrackId: true,
        },
      });

      if (!tempUser) {
        throw new HTTPError(404, `User ${extractedUserId} not found`);
      }

      if (tempUser.closedAt != null) {
        throw new HTTPError(
          409,
          `User ${extractedUserId} is closed. Please sign in again to restore access.`
        );
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
