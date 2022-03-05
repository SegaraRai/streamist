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
  JWT_WS_TOKEN_AUD,
  JWT_WS_TOKEN_EXPIRES_IN,
  JWT_WS_TOKEN_ISS,
} from '$shared/config';
import { client } from '$/db/lib/client';
import {
  SECRET_API_JWT_SECRET,
  SECRET_CDN_JWT_SECRET,
  SECRET_REFRESH_TOKEN_JWT_SECRET,
  SECRET_WS_JWT_SECRET,
} from '$/services/env';
import { HTTPError } from '$/utils/httpError';
import type { IAuthResponse } from '$/validators';
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
  } catch (_error: unknown) {
    // return undefined
  }
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

export function issueWSToken(
  user: UserSubset,
  timestamp: number
): Promise<string> {
  const signer = createSigner({
    algorithm: JWT_ALGORITHM,
    key: SECRET_WS_JWT_SECRET,
    aud: JWT_WS_TOKEN_AUD,
    iss: JWT_WS_TOKEN_ISS,
    clockTimestamp: timestamp,
    expiresIn: JWT_WS_TOKEN_EXPIRES_IN,
  });
  return Promise.resolve(
    signer({
      id: user.id,
      sub: user.id,
      plan: user.plan,
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
  } catch (_error: unknown) {
    // return undefined
  }
}

async function issueTokens(
  user: UserSubset,
  addRefreshToken: false
): Promise<IAuthResponse & { refresh_token: undefined }>;

async function issueTokens(
  user: UserSubset,
  addRefreshToken: true
): Promise<IAuthResponse & { refresh_token: string }>;

async function issueTokens(
  user: UserSubset,
  addRefreshToken: boolean
): Promise<IAuthResponse> {
  const timestamp = Date.now();
  const apiToken = await issueAPIToken(user, timestamp);
  const cdnToken = await issueCDNToken(user, timestamp);
  const wsToken = await issueWSToken(user, timestamp);
  const refreshToken = addRefreshToken
    ? await issueRefreshToken(user, timestamp)
    : undefined;

  return {
    access_token: apiToken,
    cdn_access_token: cdnToken,
    ws_access_token: wsToken,
    refresh_token: refreshToken,
  };
}

export async function issueTokensFromUsernamePassword(
  username: string,
  password: string
): Promise<Required<IAuthResponse>> {
  const user = await client.user.findUnique({
    where: {
      username: String(username),
    },
    select: {
      id: true,
      password: true,
      closedAt: true,
      plan: true,
      maxTrackId: true,
    },
  });
  if (!user) {
    throw new HTTPError(401, 'Invalid username or password');
  }

  const isOk = await verifyPasswordHashAsync(String(password), user.password);
  if (!isOk) {
    throw new HTTPError(401, 'Invalid username or password');
  }

  if (user.closedAt != null) {
    await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        closedAt: null,
      },
    });
  }

  return issueTokens(user, true);
}

export async function issueTokensFromRefreshToken(
  refreshToken: string
): Promise<IAuthResponse> {
  const extractedUserId = await extractUserIdFromRefreshToken(
    String(refreshToken)
  );
  if (!extractedUserId) {
    throw new HTTPError(401, 'Invalid refresh token');
  }

  // TODO(auth): check if refresh token is not revoked

  const user = await client.user.findUnique({
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

  if (!user) {
    throw new HTTPError(404, `User ${extractedUserId} not found`);
  }

  if (user.closedAt != null) {
    throw new HTTPError(
      409,
      `User ${extractedUserId} is closed. Please sign in again to restore access.`
    );
  }

  return issueTokens(user, false);
}
