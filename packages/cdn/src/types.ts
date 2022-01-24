import type { Context } from 'worktop';

export interface Bindings extends Context {
  bindings: {
    readonly APP_ORIGIN: string;
    readonly SECRET_CDN_CACHE_SECURITY_KEY_HMAC_SECRET: string;
    readonly SECRET_CDN_JWT_SECRET: string;
    readonly SECRET_CDN_STORAGE_ACCESS_REFERER: string;
  };
}
