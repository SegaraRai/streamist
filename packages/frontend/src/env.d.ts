/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CDN_ORIGIN: string;
  readonly VITE_HCAPTCHA_SITE_KEY_FOR_REGISTRATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
