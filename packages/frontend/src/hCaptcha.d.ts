import { HCaptcha } from './types';

declare global {
  interface Window {
    hcaptcha?: HCaptcha;
    hCaptchaCallback?: () => void;
  }
}
