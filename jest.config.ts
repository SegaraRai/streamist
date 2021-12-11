import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest/utils';
import { compilerOptions } from './packages/frontend/tsconfig.json';

const config: { projects: Config.InitialOptions[] } = {
  projects: [
    {
      testMatch: ['<rootDir>/packages/frontend/test/**/*.ts'],
      moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths, {
          prefix: '<rootDir>/',
        }),
        '^vue$': 'vue/dist/vue.common.js',
      },
      moduleFileExtensions: ['ts', 'js', 'vue', 'json'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
        '.*\\.(vue)$': 'vue-jest',
      },
      collectCoverageFrom: [
        '<rootDir>/packages/frontend/components/**/*.vue',
        '<rootDir>/packages/frontend/pages/**/*.vue',
      ],
    },
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/packages/server/test/**/*.ts'],
      moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: '<rootDir>/',
      }),
    },
  ],
};

export default config;
