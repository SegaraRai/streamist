require('dotenv').config({ path: '.env' });

const { build } = require('esbuild');

build({
  entryPoints: ['./src/index.ts'],
  outfile: 'index.js',
  platform: 'neutral',
  bundle: true,
  logLevel: 'info',
  watch: true,
});
