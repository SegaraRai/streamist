// @ts-check

import { readFile, readdir, rm, writeFile } from 'fs/promises';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import JSZip from 'jszip';
import { defineConfig } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import tsPaths from 'rollup-plugin-tsconfig-paths';

const { TARGET_NODE_ENV } = process.env;
if (TARGET_NODE_ENV !== 'production' && TARGET_NODE_ENV !== 'staging') {
  throw new Error(`TARGET_NODE_ENV must be 'production' or 'staging'`);
}

export default defineConfig({
  input: 'src/indexLambda.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    entryFileNames: 'index.js',
    manualChunks: (chunk) =>
      /node_modules/.test(chunk) ? 'vendor' : undefined,
  },
  plugins: [
    {
      name: 'package',
      buildStart: async () => {
        await rm('dist', {
          force: true,
          recursive: true,
        });
      },
      writeBundle: async () => {
        const zip = new JSZip();
        const files = await readdir('dist');
        for (const file of files) {
          if (!file.endsWith('.js')) {
            continue;
          }
          zip.file(file, await readFile(`dist/${file}`));
        }
        zip.file(
          'sRGB_v4_ICC_preference.icc',
          await readFile('sRGB_v4_ICC_preference.icc')
        );
        zip.file('imconfig/policy.xml', await readFile('policy.xml'));
        const zipContent = await zip.generateAsync({
          type: 'nodebuffer',
          compressionOptions: {
            level: 9,
          },
        });
        await writeFile('dist.zip', zipContent);
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
        'process.env.BUILD_REV': `"${
          process.env.TARGET_BUILD_REV || 'unknown'
        }"`,
        'process.env.NODE_ENV': `"${TARGET_NODE_ENV}"`,
        'process.env.PLATFORM_TYPE': '"lambda"',
      },
      minify: false,
      target: 'node14',
    }),
    commonjs(),
    terser(),
  ],
});
