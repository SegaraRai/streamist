import { createAsyncCache } from '$shared/asyncCache';
import { TOKEN_SHOULD_RENEW_TOLERANCE } from '~/config';
import { isAxiosError } from '~/logic/axiosError';
import { isJWTExpired } from '~/logic/jwt';
import { unAuthAPI } from '~/logic/unAuthAPI';
import { loggedInRef } from '~/stores/auth';

export interface Tokens {
  readonly apiToken: string;
  readonly cdnToken: string;
  readonly wsToken: string;
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
        wsToken: tokens.ws_access_token,
      };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status != null && status >= 400 && status < 500) {
          // console.log('cleared refreshToken');
          localStorage.removeItem('refreshToken');
          loggedInRef.value = false;
        }
      }
      throw error;
    }
  },
  (tokens): boolean =>
    !isJWTExpired(tokens.apiToken) && !isJWTExpired(tokens.cdnToken),
  (tokens): boolean =>
    isJWTExpired(tokens.apiToken, TOKEN_SHOULD_RENEW_TOLERANCE) ||
    isJWTExpired(tokens.cdnToken, TOKEN_SHOULD_RENEW_TOLERANCE)
);

export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await tokens.valueAsync;
    return true;
  } catch (_error) {
    return false;
  }
}
