require('dotenv').config({ path: '../shared-server/env/development.env' });

const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

build({
  entryPoints: ['./src/indexDevelopment.ts'],
  outfile: 'dist/index_dev.js',
  platform: 'node',
  target: 'node16',
  bundle: true,
  logLevel: 'info',
  plugins: [
    nodeExternalsPlugin({
      allowList: ['node-fetch'],
    }),
  ],
  watch: true,
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID': JSON.stringify(
      process.env.SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID
    ),
    'process.env.SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY': JSON.stringify(
      process.env.SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY
    ),
  },
});
