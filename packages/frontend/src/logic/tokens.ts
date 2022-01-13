import { createAsyncCache } from '$shared/asyncCache';
import { TOKEN_SHOULD_RENEW_TOLERANCE } from '~/config';
import { isJWTNotExpired } from '~/logic/jwt';
import unAuthAPI from '~/logic/unAuthAPI';
import { isAxiosError } from './axiosError';

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
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status != null && status >= 400 && status < 500) {
          // console.log('cleared refreshToken');
          localStorage.removeItem('refreshToken');
        }
      }
      throw error;
    }
  },
  (tokens): boolean =>
    isJWTNotExpired(tokens.apiToken) && isJWTNotExpired(tokens.cdnToken),
  (tokens): boolean =>
    isJWTNotExpired(tokens.apiToken, TOKEN_SHOULD_RENEW_TOLERANCE) &&
    isJWTNotExpired(tokens.cdnToken, TOKEN_SHOULD_RENEW_TOLERANCE)
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
