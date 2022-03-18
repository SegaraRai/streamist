export const CDN_ENDPOINT =
  import.meta.env.MODE === 'development'
    ? `${location.protocol}//${location.hostname}${
        import.meta.env.VITE_CDN_PORT
      }`
    : import.meta.env.VITE_CDN_ORIGIN;
export const HCAPTCHA_SITE_KEY_FOR_REGISTRATION = import.meta.env
  .VITE_HCAPTCHA_SITE_KEY_FOR_REGISTRATION;
