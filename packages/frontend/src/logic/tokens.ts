import { createAsyncCache } from '$shared/asyncCache';
import { isJWTNotExpired } from './jwt';
import unAuthAPI from './unAuthAPI';

export interface Tokens {
  readonly apiToken: string;
  readonly cdnToken: string;
}

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
  (tokens) =>
    isJWTNotExpired(tokens.apiToken) && isJWTNotExpired(tokens.cdnToken),
  (tokens) =>
    isJWTNotExpired(tokens.apiToken, -5 * 60) &&
    isJWTNotExpired(tokens.cdnToken, -5 * 60)
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

export function isAuthenticated(): Promise<boolean> {
  return tokens.valueAsync.then(() => true).catch(() => false);
}
