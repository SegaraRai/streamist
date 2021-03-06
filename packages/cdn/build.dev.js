require('dotenv').config({ path: '../shared-server/env/development.env' });

const { build } = require('esbuild');

// watch is handled by miniflare
build({
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index_dev.js',
  platform: 'neutral',
  bundle: true,
  logLevel: 'info',
  define: {
    'BUILD_TIME_DEFINITION.BUILD_REV': '"development"',
    'BUILD_TIME_DEFINITION.NODE_ENV': '"development"',
  },
});
