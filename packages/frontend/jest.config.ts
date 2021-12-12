import type { Config } from '@jest/types';
import { readFileSync } from 'node:fs';
import { pathsToModuleNameMapper } from 'ts-jest/utils';
import { parseConfigFileTextToJson } from 'typescript';

function loadTSConfig(filename: string): any {
  const content = readFileSync(filename, 'utf8');
  const { config } = parseConfigFileTextToJson(filename, content);
  return config;
}

const config: Config.InitialOptions = {
  displayName: 'client',
  testMatch: ['<rootDir>/packages/frontend/test/**/*.ts'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(
      loadTSConfig('./tsconfig.json').compilerOptions.paths,
      {
        prefix: '<rootDir>/',
      }
    ),
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
};

export default config;
