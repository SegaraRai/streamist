// @ts-check

import { copyFile, mkdir, rm } from 'fs/promises';
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
    dir: 'gcr/app',
    format: 'cjs',
    entryFileNames: 'index.js',
    manualChunks: (chunk) =>
      /node_modules/.test(chunk) ? 'vendor' : undefined,
  },
  plugins: [
    {
      name: 'package',
      buildStart: async () => {
        await rm('gcr/app', {
          force: true,
          recursive: true,
        });
      },
      writeBundle: async () => {
        await copyFile(
          'sRGB_ICC_v4_Appearance.icc',
          'gcr/app/sRGB_ICC_v4_Appearance.icc'
        );
        await mkdir('gcr/app/bin', {
          recursive: true,
        });
        await copyFile('ffmpeg', 'gcr/app/bin/ffmpeg');
        await copyFile('magick', 'gcr/app/bin/magick');
        await copyFile('mkclean', 'gcr/app/bin/mkclean');
        await mkdir('gcr/app/imconfig', {
          recursive: true,
        });
        await copyFile('policy.xml', 'gcr/app/imconfig/policy.xml');
      },
    },
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
        'process.env.PLATFORM_TYPE': '"gcr"',
      },
      minify: false,
      target: 'node16',
    }),
    commonjs(),
    terser(),
  ],
});
