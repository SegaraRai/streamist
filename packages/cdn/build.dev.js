require('dotenv').config({ path: '.env' });

const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

build({
  entryPoints: ['./src/index.ts'],
  outfile: 'index.js',
  platform: 'neutral',
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
