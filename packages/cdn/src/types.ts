import type { Context } from 'worktop';

export interface Bindings extends Context {
  bindings: {
    APP_ORIGIN: string;
    SECRET_CACHE_SECURITY_KEY: string;
    SECRET_CDN_JWT_SECRET: string;
    SECRET_STORAGE_ACCESS_REFERER: string;
  };
}
