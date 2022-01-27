// @ts-check

import { cp, readFile, rm, writeFile } from 'fs/promises';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import esbuild from 'rollup-plugin-esbuild';
// import { terser } from 'rollup-plugin-terser';
import tsPaths from 'rollup-plugin-tsconfig-paths';

const DOCKER_APP_DIR = 'docker/docker.server/app';

/**
 * @param {string} packageName
 * @returns {Promise<string>}
 */
const getPackageVersion = async (packageName) => {
  return JSON.parse(
    await readFile(require.resolve(`${packageName}/package.json`), 'utf8')
  ).version;
};

/**
 * @param {readonly string[]} packageNames
 * @returns {Promise<Record<string, string>>}
 */
const createDependencies = async (packageNames) => {
  packageNames = [...packageNames].sort();
  return Object.fromEntries(
    await Promise.all(
      packageNames.map(async (packageName) => [
        packageName,
        `=${await getPackageVersion(packageName)}`,
      ])
    )
  );
};

const { TARGET_NODE_ENV } = process.env;
if (TARGET_NODE_ENV !== 'production' && TARGET_NODE_ENV !== 'staging') {
  throw new Error(`TARGET_NODE_ENV must be 'production' or 'staging'`);
}

export default defineConfig({
  input: 'entrypoints/index.ts',
  output: {
    dir: `${DOCKER_APP_DIR}/dist`,
    format: 'cjs',
    entryFileNames: '[name].js',
    chunkFileNames: 'chunk.[name].[hash].js',
    manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
  },
  external: [
    /^node:|^_http_common$/,
    /^[@.]?prisma(\/|$)/,
    /node_modules[\\/][@.]?prisma(\/|$)/,
    /^fastify(\/|$)/,
    /^fastify-helmet(\/|$)/,
    /^fastify-jwt(\/|$)/,
    /^google-gax(\/|$)/,
    /^pino/,
    /^protobufjs(\/|$)/,
    /^semver(\/|$)/,
  ],
  plugins: [
    {
      name: 'package',
      buildStart: async () => {
        await rm(DOCKER_APP_DIR, {
          force: true,
          recursive: true,
        });
      },
      writeBundle: async () => {
        await cp('prisma', `${DOCKER_APP_DIR}/prisma`, {
          force: true,
          recursive: true,
        });
        await rm(`${DOCKER_APP_DIR}/prisma/.env`, {
          force: true,
        });
        await rm(`${DOCKER_APP_DIR}/prisma/.env.example`, {
          force: true,
        });
        const thisPackageJSON = JSON.parse(
          await readFile('package.json', 'utf8')
        );
        const bundledPackageJSON = {
          name: '@streamist/server-bundled',
          version: thisPackageJSON.version,
          description: thisPackageJSON.description,
          main: 'dist/index.js',
          private: true,
          dependencies: await createDependencies([
            '@prisma/client',
            'prisma',
            'fastify',
            'fastify-helmet',
            'fastify-jwt',
            'google-gax',
            'pino',
            'pino-pretty',
            'protobufjs',
            'semver',
          ]),
        };
        await writeFile(
          `${DOCKER_APP_DIR}/package.json`,
          JSON.stringify(bundledPackageJSON, null, 2)
        );
      },
    },
    tsPaths({
      // load other project's tsconfig.json
      // this is required to resolve child project dependencies (such as `$shared`) imported from project dependencies (such as $shared-server)
      tsConfigPath: [
        'tsconfig.json',
        '../shared/tsconfig.json',
        '../shared-server/tsconfig.json',
        '../transcoder/tsconfig.json',
      ],
    }),
    nodeResolve({
      exportConditions: ['node'],
      extensions: ['.js', '.mjs', '.ts', '.json', '.node'],
    }),
    json({
      preferConst: true,
    }),
    esbuild({
      define: {
        'process.env.NODE_ENV': `"${TARGET_NODE_ENV}"`,
      },
      minify: false,
      target: 'node16',
    }),
    commonjs(),
    // terser(),
  ],
});
