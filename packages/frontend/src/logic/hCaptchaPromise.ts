import type { HCaptcha } from '~/types';

export const hCaptchaPromise = new Promise<HCaptcha>((resolve): void => {
  if (window.hcaptcha) {
    resolve(window.hcaptcha);
    return;
  }

  window.hCaptchaCallback = (): void => {
    resolve(window.hcaptcha!);
  };
});
