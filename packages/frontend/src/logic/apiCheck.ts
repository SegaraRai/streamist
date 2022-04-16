export type APIStatus =
  | 'ok'
  | 'ng_needs_auth'
  | 'ng_origin_down'
  | 'ng_cf_down'
  | 'ng_no_connection';

export async function checkAPIStatus(): Promise<APIStatus> {
  if (!navigator.onLine) {
    return 'ng_no_connection';
  }

  try {
    const pingRes = await fetch(`/api/ping?_=${Date.now()}`, {
      method: 'POST',
      redirect: 'manual',
    });

    // Cloudflare Access
    // we cannot get redirected URL
    if (pingRes.type === 'opaqueredirect') {
      return 'ng_needs_auth';
    }

    const pingResText = await pingRes.text();

    if (
      pingRes.status >= 200 &&
      pingRes.status < 300 &&
      pingResText === 'streamist'
    ) {
      return 'ok';
    }

    // Browser integrity check and CAPTCHA
    // status: 403 or 503
    if (
      (pingResText.includes('cloudflare') ||
        pingResText.includes('Cloudflare')) &&
      (pingResText.includes('cf-please-wait') ||
        pingResText.includes('cf-browser-verification') ||
        pingResText.includes('cf-captcha-container') ||
        pingResText.includes('challenge-form') ||
        pingResText.includes('managed-form'))
    ) {
      return 'ng_needs_auth';
    }

    // origin down
    return 'ng_origin_down';
  } catch (_error: unknown) {
    // do nothing
  }

  return 'ng_no_connection';
}
