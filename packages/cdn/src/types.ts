import type { Context } from 'worktop';

export interface Bindings extends Context {
  bindings: {
    readonly APP_ORIGIN: string;
    readonly DEV_CDN_SKIP_COOKIE_AUTH: '0' | '1';
    readonly DEV_CDN_SKIP_ORIGIN_CHECK: '0' | '1';
    readonly SECRET_CDN_CACHE_SECURITY_KEY_HMAC_SECRET: string;
    readonly SECRET_CDN_JWT_SECRET: string;
    readonly SECRET_CDN_STORAGE_ACCESS_REFERRER: string;
  };
}
