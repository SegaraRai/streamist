// @ts-check

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import tsPaths from 'rollup-plugin-tsconfig-paths';

const { TARGET_NODE_ENV } = process.env;
if (TARGET_NODE_ENV !== 'production' && TARGET_NODE_ENV !== 'staging') {
  throw new Error(`TARGET_NODE_ENV must be 'production' or 'staging'`);
}

export default defineConfig({
  input: 'src/index.ts',
  output: {
    file: 'dist/index.mjs',
    format: 'es',
  },
  plugins: [
    tsPaths({
      tsConfigPath: [
        'tsconfig.json',
        '../shared/tsconfig.json',
        '../shared-server/tsconfig.json',
      ],
    }),
    nodeResolve({
      browser: true,
      extensions: ['.ts', '.js', '.json'],
    }),
    esbuild({
      minify: false,
      define: {
        'BUILD_TIME_DEFINITION.NODE_ENV': `"${TARGET_NODE_ENV}"`,
      },
      target: 'es2021',
    }),
    commonjs(),
    terser(),
  ],
});
