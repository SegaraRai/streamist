require('dotenv').config({ path: '.env' });

const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

build({
  entryPoints: ['./entrypoints/index.ts'],
  outfile: 'dist/index_dev.js',
  platform: 'node',
  target: 'node16',
  bundle: true,
  logLevel: 'info',
  plugins: [
    nodeExternalsPlugin({
      allowList: ['class-transformer', 'node-fetch', 'p-queue'],
    }),
  ],
  watch: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
});
