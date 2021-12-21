import { createAsyncCache } from './asyncCache';
import { CDN_ENDPOINT } from './cdn';
import { isJWTNotExpired } from './jwt';
import { tokens } from './tokens';

async function setTokenCookie(token: string): Promise<void> {
  const res = await fetch(`${CDN_ENDPOINT}/api/cookies/token`, {
    credentials: 'include',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`failed to set cookie: ${res.status} ${res.statusText}`);
  }
}

let lastSetCookie: string | undefined;
const cdnCookieAsyncCache = createAsyncCache<string>(
  async (): Promise<string> => {
    const token = (await tokens.valueAsync).cdnToken;
    if (lastSetCookie !== token) {
      await setTokenCookie(token);
      lastSetCookie = token;
    }
    return token;
  },
  (token: string): boolean => {
    return lastSetCookie === token && isJWTNotExpired(token);
  }
);

export function isCDNCookieSet(): boolean {
  return cdnCookieAsyncCache.value != null;
}

export async function setCDNCookie(): Promise<void> {
  await cdnCookieAsyncCache.renew();
}
