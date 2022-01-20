import { CACHE_CONTROL_NO_STORE } from '$shared/config';
import { userCreate, userDoesExist } from '$/services/accountRegister';
import { HCAPTCHA_SITE_KEY_REGISTRATION } from '$/services/env';
import { verifyHCaptcha } from '$/services/hCaptcha';
import { HTTPError } from '$/utils/httpError';
import { defineController } from './$relay';

export default defineController(() => ({
  get: async ({ query }) => {
    const exists = await userDoesExist(query.username);
    return {
      status: 200,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
      },
      body: {
        exists,
      },
    };
  },
  post: async ({ body, query }) => {
    const isCaptchaOk = await verifyHCaptcha(
      HCAPTCHA_SITE_KEY_REGISTRATION,
      query?.captchaResponse
    );
    if (!isCaptchaOk) {
      throw new HTTPError(400, 'Captcha is not valid');
    }

    const user = await userCreate(body);
    return {
      status: 201,
      headers: {
        'Cache-Control': CACHE_CONTROL_NO_STORE,
        Location: `/api/accounts/${user.id}`,
      },
    };
  },
}));
