import { createAsyncCache } from '$shared/asyncCache';
import { CDN_ENDPOINT } from '~/config';
import { isJWTNotExpired } from '~/logic/jwt';
import { tokens } from '~/logic/tokens';

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
    return (
      !tokens.renewing &&
      tokens.value?.cdnToken === token &&
      isJWTNotExpired(token)
    );
  }
);

export function isCDNCookieSet(): boolean {
  return cdnCookieAsyncCache.value != null;
}

export async function setCDNCookie(): Promise<void> {
  await cdnCookieAsyncCache.renew();
}

export async function renewTokensAndSetCDNCookie(force = false): Promise<void> {
  await tokens.renew(force);
  await cdnCookieAsyncCache.renew();
}

export function needsCDNCookie(url: string): boolean {
  return url.startsWith('http');
}
