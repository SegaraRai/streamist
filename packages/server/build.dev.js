require('dotenv').config({ path: '.env' });

const { build } = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

build({
  entryPoints: ['./entrypoints/index.ts'],
  outfile: 'index.js',
  platform: 'node',
  target: 'node16',
  bundle: true,
  logLevel: 'info',
  plugins: [nodeExternalsPlugin()],
  watch: true,
  define: {
    'process.env.NODE_ENV': '"development"',
  },
});
