require('dotenv').config({ path: '.env' });

const { build } = require('esbuild');

// watch is handled by miniflare
build({
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index_dev.js',
  platform: 'neutral',
  bundle: true,
  logLevel: 'info',
  define: {
    NODE_ENV: '"development"',
  },
});
