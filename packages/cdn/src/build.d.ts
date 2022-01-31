declare global {
  interface BUILD_TIME_DEFINITION {
    readonly BUILD_REV: string;
    readonly NODE_ENV: string;
  }

  const BUILD_TIME_DEFINITION: BUILD_TIME_DEFINITION;
}

export {};
