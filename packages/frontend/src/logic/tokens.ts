import { createAsyncCache } from '$shared/asyncCache';
import { isJWTNotExpired } from './jwt';
import unAuthAPI from './unAuthAPI';

export interface Tokens {
  readonly apiToken: string;
  readonly cdnToken: string;
}

const TOLERANCE_FOR_SHOULD_RENEW = -5 * 60;

export const tokens = createAsyncCache<Tokens>(
  async (): Promise<Tokens> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('refreshToken not found');
    }

    try {
      const tokens = await unAuthAPI.auth.token.$post({
        body: {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
      });

      if (tokens.refresh_token) {
        localStorage.setItem('refreshToken', tokens.refresh_token);
      }

      return {
        apiToken: tokens.access_token,
        cdnToken: tokens.cdn_access_token,
      };
    } catch (error: unknown) {
      localStorage.removeItem('refreshToken');
      throw error;
    }
  },
  (tokens): boolean =>
    isJWTNotExpired(tokens.apiToken) && isJWTNotExpired(tokens.cdnToken),
  (tokens): boolean =>
    isJWTNotExpired(tokens.apiToken, TOLERANCE_FOR_SHOULD_RENEW) &&
    isJWTNotExpired(tokens.cdnToken, TOLERANCE_FOR_SHOULD_RENEW)
);

export async function authenticate(
  username: string,
  password: string
): Promise<boolean> {
  try {
    const {
      access_token: apiToken,
      cdn_access_token: cdnToken,
      refresh_token: refreshToken,
    } = await unAuthAPI.auth.token.$post({
      body: {
        grant_type: 'password',
        username,
        password,
      },
    });

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    tokens.value = {
      apiToken,
      cdnToken,
    };

    return true;
  } catch (error: unknown) {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await tokens.valueAsync;
    return true;
  } catch (_error) {
    return false;
  }
}
