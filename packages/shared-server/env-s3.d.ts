declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly SECRET_WASABI_ACCESS_KEY_ID: string;
    readonly SECRET_WASABI_SECRET_ACCESS_KEY: string;
  }
}
