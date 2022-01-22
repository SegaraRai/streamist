declare global {
  interface BUILD_TIME_DEFINITION {
    readonly NODE_ENV: string;
  }

  const BUILD_TIME_DEFINITION: BUILD_TIME_DEFINITION;
}

export {};
