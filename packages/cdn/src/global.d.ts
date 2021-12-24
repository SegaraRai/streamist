// secrets
declare const SECRET_CACHE_SECURITY_KEY: string;
declare const SECRET_STORAGE_ACCESS_USER_AGENT: string;
declare const SECRET_JWK_PUBLIC_KEY_SPKI_ARRAY: number[];

/**
 * KV
 */
declare const kvJWTCache: KVNamespace;

/**
 * edge local context
 */
declare interface WorkerGlobalScope {
  jwtCache?: Map<string, number>;
}

/**
 * interface of `process.env`
 */
declare interface ProcessEnv {
  // only NODE_ENV exists
  // see https://stackoverflow.com/q/39040108 for use of this `import`
  readonly NODE_ENV: import('@streamist/shared/lib/nodeEnv').NODE_ENV;
}

/**
 * interface for fake `process` global variable
 * will be removed in build process
 */
declare interface FakeProcess {
  readonly env: ProcessEnv;
}

/**
 * fake `process` global variable
 */
declare const process: FakeProcess;
