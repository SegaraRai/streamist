// @ts-check

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
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
  input: 'src/indexGCR.ts',
  output: {
    file: 'gcr/app/index.js',
    format: 'cjs',
    inlineDynamicImports: true,
  },
  plugins: [
    tsPaths({
      // load other project's tsconfig.json
      // this is required to resolve child project dependencies (such as `$shared`) imported from project dependencies (such as $shared-server)
      tsConfigPath: [
        'tsconfig.json',
        '../shared/tsconfig.json',
        '../shared-server/tsconfig.json',
      ],
    }),
    nodeResolve({
      exportConditions: ['node'],
      extensions: ['.js', '.mjs', '.ts', '.json', '.node'],
      preferBuiltins: true,
    }),
    json({
      preferConst: true,
    }),
    esbuild({
      define: {
        'process.env.NODE_ENV': `"${TARGET_NODE_ENV}"`,
      },
      minify: false,
      target: 'node14',
    }),
    commonjs(),
    terser(),
  ],
});
