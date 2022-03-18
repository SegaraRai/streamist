/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_REV: string;
  /**
   * only for development
   * @example ':8787'
   */
  readonly VITE_CDN_PORT: string;
  /**
   * only for staging and production
   * @example 'https://stst.page'
   */
  readonly VITE_CDN_ORIGIN: string;
  readonly VITE_HCAPTCHA_SITE_KEY_FOR_REGISTRATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
