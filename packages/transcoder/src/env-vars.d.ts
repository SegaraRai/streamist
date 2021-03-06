/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // build time
    readonly BUILD_REV: string;
    readonly NODE_ENV: 'development' | 'production' | 'staging' | 'test';
    readonly PLATFORM_TYPE: 'development' | 'lambda' | 'gcr';

    readonly API_ORIGIN_FOR_TRANSCODER: string;
    readonly SECRET_API_CLIENT_REFERRER: string;
    readonly SECRET_TRANSCODER_CALLBACK_SECRET: string;
    readonly SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID: string;
    readonly SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY: string;
  }
}
