import type { HCaptcha } from '~/types';

export const hCaptchaPromise = new Promise<HCaptcha>((resolve): void => {
  if (window.hcaptcha) {
    resolve(window.hcaptcha);
    return;
  }

  window.hCaptchaCallback = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resolve(window.hcaptcha!);
  };
});
