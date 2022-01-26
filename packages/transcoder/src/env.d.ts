/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    // build time
    readonly NODE_ENV: 'development' | 'staging' | 'production' | 'test';
    readonly PLATFORM_TYPE: 'lambda' | 'gcr';

    readonly SECRET_TRANSCODER_CALLBACK_SECRET: string;
    readonly SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID: string;
    readonly SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY: string;
  }
}
