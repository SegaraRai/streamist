import { createAsyncCache } from './asyncCache';
import { isJWTNotExpired } from './jwt';
import unAuthAPI from './unauthAPI';

export interface Tokens {
  readonly apiToken: string;
  readonly cdnToken: string;
}

export const tokens = createAsyncCache<Tokens>(
  async (): Promise<Tokens> => {
    let refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      /*
      if (location.pathname !== '/login') {
        location.href = '/login';
      }
      throw new Error('refreshToken not found');
      //*/

      ({ refreshToken } = await unAuthAPI.auth.authorize.$post({
        body: {
          id: 'usc1',
          pass: 'password',
        },
      }));

      localStorage.setItem('refreshToken', refreshToken);
    }

    const tokens = await unAuthAPI.auth.token.$post({
      body: {
        refreshToken,
      },
    });

    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }

    return {
      apiToken: tokens.apiToken,
      cdnToken: tokens.cdnToken,
    };
  },
  (tokens) =>
    isJWTNotExpired(tokens.apiToken) && isJWTNotExpired(tokens.cdnToken),
  (tokens) =>
    isJWTNotExpired(tokens.apiToken, -5 * 60) &&
    isJWTNotExpired(tokens.cdnToken, -5 * 60)
);
