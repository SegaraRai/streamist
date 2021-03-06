import { loggedInRef } from '~/stores/auth';
import { isAxiosError } from './axiosError';
import { extractSubFromJWT } from './jwt';
import { tokens } from './tokens';
import { unAuthAPI } from './unAuthAPI';

export type AuthenticateResult =
  | 'ok'
  | 'ng_rate_limit'
  | 'ng_invalid_credentials'
  | 'ng_unknown_error';

function clearUserData(): void {
  localStorage.removeItem('recentlyPlayed');
  localStorage.removeItem('recentlySearched');
  localStorage.removeItem('db.lastUpdate');
  localStorage.removeItem('db.nextSince');
  localStorage.removeItem('db.user');
  // not deleting database as it will be recreated on syncDB
}

export async function authenticate(
  username: string,
  password: string
): Promise<AuthenticateResult> {
  try {
    const oldUserId = localStorage.getItem('userId');

    const {
      access_token: apiToken,
      cdn_access_token: cdnToken,
      ws_access_token: wsToken,
      refresh_token: refreshToken,
    } = await unAuthAPI.auth.login.$post({
      body: {
        grant_type: 'password',
        username,
        password,
      },
    });

    const userId = extractSubFromJWT(apiToken);
    if (userId !== oldUserId) {
      clearUserData();
    }

    localStorage.setItem('userId', userId);

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    tokens.value = {
      apiToken,
      cdnToken,
      wsToken,
    };

    loggedInRef.value = true;

    return 'ok';
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      switch (error.response?.status) {
        case 401:
          return 'ng_invalid_credentials';

        case 429:
          return 'ng_rate_limit';
      }
    }
    return 'ng_unknown_error';
  }
}
