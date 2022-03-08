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

    // Origin down?
    if (
      pingRes.status === 502 ||
      pingRes.status === 503 ||
      pingRes.status >= 520
    ) {
      return 'ng_origin_down';
    }

    // Browser integrity check and CAPTCHA
    if (
      pingResText.includes('cloudflare') &&
      (pingResText.includes('challenge') || pingResText.includes('captcha'))
    ) {
      return 'ng_needs_auth';
    }

    // unknown error
    return 'ng_no_connection';
  } catch (_error: unknown) {
    // do nothing
  }

  return 'ng_no_connection';
}
