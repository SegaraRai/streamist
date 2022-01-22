require('dotenv').config({ path: '.env' });

const { build } = require('esbuild');

build({
  entryPoints: ['./src/indexLambda.ts'],
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node16',
  bundle: true,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': '"development"',
  },
});
