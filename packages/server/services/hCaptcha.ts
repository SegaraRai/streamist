import fetch from 'node-fetch';
import { SECRET_HCAPTCHA_SECRET } from '$/services/env';
import { logger } from '$/services/logger';
import { HTTPError } from '$/utils/httpError';

interface HCaptchaResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  credit?: boolean;
  score: number;
  'error-codes'?: string[];
}

export async function verifyHCaptcha(
  sitekey: string,
  captchaResponse: string
): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    logger.info('Skipping hCaptcha verification in development mode');
    return true;
  }

  const params = new URLSearchParams();
  params.append('secret', SECRET_HCAPTCHA_SECRET);
  params.append('response', captchaResponse);
  params.append('sitekey', sitekey);
  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    body: params,
  });
  if (!response.ok) {
    throw new HTTPError(
      500,
      `hCaptcha verification failed: ${response.status}`
    );
  }
  const json = (await response.json()) as HCaptchaResponse;
  return json.success;
}
